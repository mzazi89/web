// MZAZI API — POST /api/ai/chat
// The MZAZI AI assistant (site chat widget).
//
// Combines ALL of the site's free AI endpoints so they work together:
//  - DavidCyril model catalog (the same /ai/* endpoints the public API
//    platform exposes — Claude, Gemini, GPT, Llama, Qwen, Grok, Kimi…)
//  - Pollinations (OpenAI-compatible, free, keyless)
//  - DrexApp chat (free, keyless)
//
// Every source is fired in parallel with its own timeout; the FIRST
// successful answer wins and is returned. If a provider throttles or dies,
// the others keep the assistant alive. DeepSeek has been removed.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { ipRateLimit, clientIp } from '@/lib/ip-limiter';

export const dynamic = 'force-dynamic';

// Run this function in the Singapore region. Live diagnosis (2026-08-30):
// the free AI providers (DavidCyril /ai/*, Pollinations) reject or hang
// from Vercel's default (US) egress IPs, while the same calls succeed from
// Singapore egress — the site's working /api/temp-number path also reaches
// DavidCyril. Pinning the region restores egress that the providers accept.
export const preferredRegion = 'sin1';

const sql = neon(process.env.DATABASE_URL);

const SYSTEM_PROMPT = `You are MZAZI AI, the friendly support assistant of MZAZI TECH (Mzazi Tech Inc — mzazi.shop).
You read the user's question carefully and answer it directly, clearly and helpfully.
About MZAZI TECH: a technology company offering Pterodactyl panel hosting, WhatsApp automation bots, developer APIs, temporary numbers and wallet services. Customers sign up at mzazi.shop (free account), fund their wallet via Paystack (KES), and buy products from the dashboard.
How to help: answer questions about accounts, signup/login, wallet deposits, refunds (contact admin), WhatsApp bot pairing (use the WhatsApp Bot page; the pairing keyword is MZAZIBOT), API keys (API dashboard), panel servers, and payments. If you don't know, say you'll have the admin look into it and suggest sending the question to the admin.
Keep answers short (2-5 sentences), friendly, and accurate. Never invent prices or features beyond what is listed.`;

// ── DavidCyril — free AI chat models from the site's API registry ───────────
// Same request/response contract as the public API platform:
//   GET {base}/ai/{model}?prompt=… → { success, data: "…" }
// DeepSeek models are intentionally NOT included.
//
// NOTE: the base URL is hardcoded exactly like the working /api/temp-number
// route — do NOT read DAVIDCYRIL_API_URL here. That env var may point to a
// dead/alternate host in production, and temp-number proves
// https://apis.davidcyril.name.ng works from Vercel.
const DC_BASE = 'https://apis.davidcyril.name.ng';
// NOTE: no apikey is sent on the chat route's calls — DavidCyril's /ai/*
// endpoints are free and ignore the param entirely (verified 2026-08-30),
// and an env-configured key only adds a failure mode.
const DC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0 Safari/537.36';

const DC_MODELS = [
  'gpt-4o-mini',
  'gemini-3.1-flash-lite',
  'gpt-5.1-instant',
  'claude-haiku-4.5',
  'gpt-5.3-chat',
  'gemini-3.1-pro',
  'llama-4-maverick',
  'qwen3-max',
  'grok-4.1-fast',
  'kimi-k2.6',
  'claude-sonnet-4.6',
  'claude-fable-5',
];

const SOURCE_TIMEOUT_MS = 12000;

function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}

// Drill into a provider payload to find the text answer. DavidCyril returns
// { success: true, data: "…" } — the answer lives under `data` (verified
// live). Other providers vary, so we walk a known-key list and descend into
// nested objects.
function extractAnswer(payload) {
  if (typeof payload === 'string') return payload.trim() || null;
  if (!payload || typeof payload !== 'object') return null;
  if (payload.success === false) return null;
  const hit = pick(payload, ['data', 'response', 'reply', 'text', 'message', 'answer', 'content', 'output']);
  if (hit === null) return null;
  if (typeof hit === 'string') return hit.trim() || null;
  if (typeof hit === 'object') return extractAnswer(hit);
  return null;
}

async function callDavidCyril(model, fullPrompt) {
  try {
    const qs = new URLSearchParams({ prompt: fullPrompt });
    const res = await fetch(`${DC_BASE}/ai/${model}?${qs.toString()}`, {
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
      headers: { Accept: 'application/json', 'User-Agent': DC_UA },
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error(`[ai-chat] DC ${model}: HTTP ${res.status}`);
      return null;
    }
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('json')) {
      console.error(`[ai-chat] DC ${model}: non-JSON response`);
      return null;
    }
    const answer = extractAnswer(await res.json());
    if (answer) console.error(`[ai-chat] DC ${model}: OK (${answer.length} chars)`);
    return answer;
  } catch (e) {
    console.error(`[ai-chat] DC ${model}: ${e.name === 'TimeoutError' ? 'timeout' : e.message}`);
    return null;
  }
}

async function callPollinations(fullPrompt, question) {
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pollinations requires a Referer for server-to-server calls —
        // without it cloud/serverless IPs get 403s.
        Referer: 'https://www.mzazi.shop/',
        'User-Agent': 'Mozilla/5.0 (compatible; MzaziBot/1.0)',
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: question },
        ],
      }),
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[ai-chat] Pollinations: HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    const answer = json?.choices?.[0]?.message?.content || null;
    if (answer) console.error(`[ai-chat] Pollinations: OK (${answer.length} chars)`);
    return answer;
  } catch (e) {
    console.error(`[ai-chat] Pollinations: ${e.name === 'TimeoutError' ? 'timeout' : e.message}`);
    return null;
  }
}

async function callDrexApp(fullPrompt) {
  try {
    const q = encodeURIComponent(fullPrompt);
    const res = await fetch(`https://api.drexapp.space/ai/chat?q=${q}`, {
      signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error(`[ai-chat] DrexApp: HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    const answer = pick(json, ['result', 'response', 'message']);
    if (answer) console.error(`[ai-chat] DrexApp: OK`);
    return answer ? String(answer).trim() : null;
  } catch (e) {
    console.error(`[ai-chat] DrexApp: ${e.name === 'TimeoutError' ? 'timeout' : e.message}`);
    return null;
  }
}

// ── Parallel race: first successful answer wins ─────────────────────────────
function raceSources(sources) {
  return new Promise((resolve) => {
    let settled = false;
    let pending = sources.length;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    for (const run of sources) {
      run()
        .then((r) => { if (r) done(r); })
        .catch(() => {})
        .finally(() => { pending -= 1; if (pending === 0 && !settled) done(null); });
    }
  });
}

export async function POST(request) {
  try {
    // Throttle anonymous AI traffic (per warm instance).
    const limit = ipRateLimit(clientIp(request), { max: 20, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const question = String(body.question || '').trim().slice(0, 2000);
    if (!question) {
      return NextResponse.json({ error: 'Please ask a question first.' }, { status: 400 });
    }

    // Live context: current packages so the AI can quote real prices.
    let packagesTxt = '(none listed right now)';
    try {
      const rows = await sql`
        SELECT name, price, cpu, ram, disk FROM packages
        WHERE active = true ORDER BY sort_order ASC, id ASC LIMIT 6
      `;
      if (rows.length) {
        packagesTxt = rows
          .map((r) => `- ${r.name}: KES ${Number(r.price).toLocaleString()} (${r.cpu}% CPU, ${r.ram} MB RAM, ${r.disk} MB disk)`)
          .join('\n');
      }
    } catch { /* packages table may be missing */ }

    const fullPrompt = `${SYSTEM_PROMPT}\n\nCURRENT PACKAGES:\n${packagesTxt}\n\nUser question: ${question}`;

    const answer = await raceSources([
      ...DC_MODELS.map((m) => () => callDavidCyril(m, fullPrompt)),
      () => callPollinations(fullPrompt, question),
      () => callDrexApp(fullPrompt),
    ]);

    if (!answer) {
      return NextResponse.json(
        {
          error:
            'The AI assistant is temporarily unavailable. Please try again in a moment or send your question to the admin.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: String(answer).slice(0, 4000) });
  } catch (e) {
    console.error('AI chat error:', e.message);
    return NextResponse.json(
      { error: 'The AI assistant is temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
