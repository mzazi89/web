// Temporary diagnostic: what the deployed function can actually reach.
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function probe(url, init) {
  const t0 = Date.now();
  try {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 8000);
    const res = await fetch(url, { ...init, signal: c.signal });
    const body = (await res.text()).slice(0, 160).replace(/\s+/g, ' ');
    clearTimeout(timer);
    return { url, status: res.status, ms: Date.now() - t0, body };
  } catch (e) {
    return { url, error: String(e?.cause?.code || e.message).slice(0, 80), ms: Date.now() - t0 };
  }
}

export async function GET(request) {
  if (new URL(request.url).searchParams.get('t') !== 'mzdiag1') {
    return NextResponse.json({ error: 'nope' }, { status: 404 });
  }
  const out = await Promise.all([
    probe('https://api.mail.tm/domains?page=1'),
    probe('https://api.guerrillamail.com/ajax.php?f=get_email_address&lang=en'),
  ]);
  return NextResponse.json({ out });
}
