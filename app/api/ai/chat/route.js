// MZAZI API — POST /api/ai/chat
// The MZAZI AI assistant: reads the question and answers accurately using
// live site context (packages/prices) + DeepSeek.
//  1) official DeepSeek API when a `deepseek_api_key` is set in Settings
//  2) free DrexApp AI endpoints as best-effort fallback
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

const SYSTEM_PROMPT = `You are MZAZI AI, the friendly support assistant of MZAZI TECH (Mzazi Tech Inc — mzazi.shop).
You read the user's question carefully and answer it directly, clearly and helpfully.
About MZAZI TECH: a technology company offering Pterodactyl panel hosting, WhatsApp automation bots, developer APIs, temporary numbers and wallet services. Customers sign up at mzazi.shop (free account), fund their wallet via Paystack (KES), and buy products from the dashboard.
How to help: answer questions about accounts, signup/login, wallet deposits, refunds (contact admin), WhatsApp bot pairing (use the WhatsApp Bot page; the pairing keyword is MZAZIBOT), API keys (API dashboard), panel servers, and payments. If you don't know, say you'll have the admin look into it and suggest sending the question to the admin.
Keep answers short (2-5 sentences), friendly, and accurate. Never invent prices or features beyond what is listed.`;

async function getSetting(key) {
  try {
    const rows = await sql`SELECT value FROM settings WHERE key = ${key} LIMIT 1`;
    return rows[0]?.value ? String(rows[0].value).trim() : '';
  } catch {
    return '';
  }
}

export async function POST(request) {
  try {
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

    const fullPrompt = `${SYSTEM_PROMPT}\n\nCURRENT PACKAGES:\n${packagesTxt}`;
    let response = '';

    // 1) Official DeepSeek API (reliable) — needs a key in Settings
    const deepseekKey = await getSetting('deepseek_api_key');
    if (deepseekKey) {
      try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${deepseekKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: fullPrompt },
              { role: 'user', content: question },
            ],
            max_tokens: 700,
          }),
          signal: AbortSignal.timeout(45000),
        });
        const json = await res.json();
        response = json?.choices?.[0]?.message?.content || '';
      } catch (e) {
        console.error('DeepSeek API error:', e.message);
      }
    }

    // 2) Free DrexApp fallbacks (best-effort)
    if (!response) {
      try {
        const json = await fetch(
          `https://api.drexapp.space/ai/deepseek?q=${encodeURIComponent(`${fullPrompt}\n\nUser question: ${question}`)}`,
          { signal: AbortSignal.timeout(20000) }
        ).then((r) => r.json());
        response = json?.message || json?.response || json?.result || '';
      } catch { /* try next */ }
    }
    if (!response) {
      try {
        const fb = await fetch(
          `https://api.drexapp.space/ai/chat?q=${encodeURIComponent(`${fullPrompt}\n\nUser question: ${question}`)}`,
          { signal: AbortSignal.timeout(15000) }
        ).then((r) => r.json());
        response = fb?.result || fb?.response || fb?.message || '';
      } catch { /* both failed */ }
    }

    if (!response) {
      return NextResponse.json(
        { error: 'The AI assistant is busy right now. Please try again in a moment, or send your question to the admin.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ response: String(response).slice(0, 4000) });
  } catch (e) {
    console.error('AI chat error:', e.message);
    return NextResponse.json({ error: 'AI request failed. Please try again.' }, { status: 500 });
  }
}
