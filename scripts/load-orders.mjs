/**
 * Simula carga: node scripts/load-orders.mjs [n] [baseUrl]
 * Requiere order-service en marcha.
 */
const n = Number(process.argv[2] || 20);
const base = process.argv[3] || 'http://localhost:3000';

async function one(i) {
  const body = {
    customerId: `load-${i % 5}`,
    items: [{ sku: `SKU-${i % 10}`, qty: (i % 3) + 1, unitPrice: 9.99 + i }],
    currency: 'EUR',
  };
  const res = await fetch(`${base}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${await res.text()}`);
  }
  return res.json();
}

const t0 = Date.now();
let ok = 0;
for (let i = 0; i < n; i++) {
  try {
    await one(i);
    ok++;
  } catch (e) {
    console.error(`[load] fail i=${i}`, e);
  }
}
const dt = (Date.now() - t0) / 1000;
console.log(`[load] done ok=${ok}/${n} in ${dt.toFixed(2)}s (~${(ok / dt).toFixed(1)} req/s)`);
