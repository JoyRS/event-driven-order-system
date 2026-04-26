/**
 * Retención demo en MongoDB (índice TTL sobre `createdAt`).
 * `0` o negativo: no registrar índice TTL (útil para depuración local).
 */
export function demoRecordTtlSeconds(): number {
  const raw = process.env.DEMO_RECORD_TTL_SECONDS;
  if (raw === '' || raw === undefined) return 86_400;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 86_400;
}
