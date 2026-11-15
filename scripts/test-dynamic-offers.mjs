// Integration tests for the Dynamic Offers layer — no network, no database.
//
// Exercise everything that decides whether a customer sees the truth: number
// normalisation, payload templating, response reading, error classification and
// the timeout path. The live gateway is never called.
import assert from 'node:assert/strict';

// neon() throws at import time without a URL; nothing here opens a socket.
process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';

const base = new URL('../lib/daraja/', import.meta.url).pathname;
const { normaliseOffers, fill } = await import(`${base}config.js`);
const { classify, explain, fetchWithTimeout } = await import(`${base}client.js`);
// Imported from the M-PESA module directly: lib/daraja/service.js uses the
// '@/' alias, which only Next resolves, and the function under test is the same.
const { normalizeMpesaPhone: normaliseMsisdn } = await import(new URL('../lib/mpesa.js', import.meta.url).pathname);

const cases = [];
const test = (name, fn) => cases.push([name, fn]);

test('numbers normalise to 2547XXXXXXXX', () => {
  const map = {
    '0712345678': '254712345678',
    '0110000000': '254110000000',
    '+254 712 345 678': '254712345678',
    '254712345678': '254712345678',
    '712345678': '254712345678',
  };
  for (const [input, want] of Object.entries(map)) assert.equal(normaliseMsisdn(input), want, input);
  for (const bad of ['', '12345', '0700', 'abc']) assert.equal(normaliseMsisdn(bad), null, bad);
});

test('templates are filled; unknown keys become empty', () => {
  assert.equal(fill('{"a":"{{msisdn}}"}', { msisdn: '254712345678' }), '{"a":"254712345678"}');
  assert.equal(fill('{{missing}}', {}), '');
});

test('reads the documented offer shapes', () => {
  const one = normaliseOffers({ offers: [{ offerId: 'X1', name: '1GB', sizeMb: 1024, price: 100 }] });
  assert.deepEqual(one.offers.map((o) => [o.id, o.sizeMb, o.price]), [['X1', 1024, 100]]);
  assert.equal(normaliseOffers({ data: { offers: [{ id: 'Y', amount: '50' }] } }).offers[0].price, 50);
  assert.equal(normaliseOffers({ body: { offers: [] } }).offers.length, 0);
});

test('an unknown shape is reported, never guessed', () => {
  const r = normaliseOffers({ unexpected: true });
  assert.equal(r.shapeKnown, false);
  assert.equal(r.offers.length, 0);
});

test('entries without an id are dropped', () => {
  assert.equal(normaliseOffers({ offers: [{ name: 'no id' }, { offerId: 'ok' }] }).offers.length, 1);
});

test('statuses classify into actionable kinds', () => {
  assert.equal(classify(401), 'auth');
  assert.equal(classify(403), 'permission');
  assert.equal(classify(404), 'not_found');
  assert.equal(classify(429), 'rate');
  assert.equal(classify(503), 'upstream');
});

test('errors prefer Safaricom wording', () => {
  assert.equal(explain(400, { header: { customerMessage: 'Invalid MSISDN' } }), 'Invalid MSISDN');
  assert.match(explain(403, null), /not authorised/i);
  assert.match(explain(404, null), /does not exist/i);
});

test('a hanging upstream aborts instead of holding the route', async () => {
  const real = global.fetch;
  global.fetch = (_u, init) => new Promise((_res, reject) => {
    init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  });
  await assert.rejects(() => fetchWithTimeout('https://example.test', {}, 40), (e) => e.kind === 'timeout');
  global.fetch = real;
});

let failed = 0;
for (const [name, fn] of cases) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}
console.log(`\n${cases.length - failed}/${cases.length} passing`);
process.exit(failed ? 1 : 0);
