// MZAZI API — POST /api/ai/chat
// The MZAZI AI assistant: understands site questions (services, prices,
// accounts, orders…) using live context + the DeepSeek AI backend.
import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
const sql = neon(process.env.DATABASE_URL);

const SYSTEM_PROMPT = `You are MZAZI AI, the friendly support assistant of MZAZI TECH (Mzazi Tech Inc — mzazi.shop).
You read the user's question carefully and answer it directly, clearly and helpfully.
About MZAZI TECH: a technology company offering Pterodactyl panel hosting, WhatsApp automation bots, developer APIs, temporary numbers and wallet services. Customers sign up at mzazi.shop (free account), fund their wallet via Paystack (KES), and buy products from the dashboard.
How to help: answer questions about accounts, signup/login, wallet deposits, refunds (contact admin), WhatsApp bot pairing (use the WhatsApp Bot page; the pairing keyword is MZAZIBOT), API keys (API dashboard), panel servers, and payments. If you don't know, say you'll have the admin look into it and suggest sending the question to the admin.
Keep answers short (2-5 sentences), friendly, and accurate. Never invent prices or features beyond what is listed.`;

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
    } catch { /* packages table may be missing — context stays generic */ }

    const fullQuery = `${SYSTEM_PROMPT}\n\nCURRENT PACKAGES:\n${packagesTxt}\n\nUser question: ${question}`;

    // 1) DeepSeek AI
    let response = '';
    try {
      const json = await fetch(
        `https://api.drexapp.space/ai/deepseek?q=${encodeURIComponent(fullQuery)}`,
        { signal: AbortSignal.timeout(25000) }
      ).then((r) => r.json());
      response = json?.message || json?.response || json?.result || json?.answer || '';
    } catch { /* try fallback */ }

    // 2) Fallback AI
    if (!response) {
      try {
        const fb = await fetch(
          `https://api.drexapp.space/ai/chat?q=${encodeURIComponent(fullQuery)}`,
          { signal: AbortSignal.timeout(20000) }
        ).then((r) => r.json());
        response = fb?.result || fb?.response || fb?.message || fb?.answer || '';
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
