'use client';

import { useEffect, useState } from 'react';

type Stats = {
  windowSeconds: number;
  eventsLastMinute: number;
  eventsPerSecond: number;
  byMetricName: Record<string, number>;
  totals: { orders: number; dlq: number; processedEvents: number };
  recentDlq: Array<{
    id: string;
    originalSubject: string;
    originalEventId: string;
    orderId: string;
    error: string;
    attempts: number;
    createdAt?: Date;
  }>;
  fetchedAt: string;
};

export default function HomePage() {
  const [data, setData] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch('/api/stats', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || `HTTP ${res.status}`);
        }
        if (!cancelled) {
          setData(json as Stats);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
        }
      }
    }

    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <main>
      <h1>Event-driven order system</h1>
      <p className="sub">Dashboard de demo — ventana móvil de {data?.windowSeconds ?? 60}s para métricas (colección <code>metric_events</code>).</p>

      {err ? <div className="error">No se pudo leer MongoDB: {err}</div> : null}

      {data ? (
        <>
          <div className="grid">
            <div className="card">
              <h2>Eventos / minuto</h2>
              <div className="metric">{data.eventsLastMinute}</div>
              <div className="muted">~{data.eventsPerSecond} eventos/s (promedio en ventana)</div>
            </div>
            <div className="card">
              <h2>Pedidos (total)</h2>
              <div className="metric">{data.totals.orders}</div>
              <div className="muted">Colección <code>orders</code></div>
            </div>
            <div className="card">
              <h2>DLQ persistidos</h2>
              <div className="metric">{data.totals.dlq}</div>
              <div className="muted">Colección <code>dlq_records</code></div>
            </div>
            <div className="card">
              <h2>Eventos procesados</h2>
              <div className="metric">{data.totals.processedEvents}</div>
              <div className="muted">Colección <code>processed_events</code></div>
            </div>
          </div>

          <h3 className="section-title">Desglose por métrica (último minuto)</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th>Conteo</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.byMetricName).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="muted">
                      Sin eventos en la ventana (crea pedidos con el order-service).
                    </td>
                  </tr>
                ) : (
                  Object.entries(data.byMetricName).map(([k, v]) => (
                    <tr key={k}>
                      <td>
                        <span className="pill">{k}</span>
                      </td>
                      <td className="metric" style={{ fontSize: '1rem' }}>
                        {v}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 className="section-title" style={{ marginTop: '1.75rem' }}>
            Últimos registros DLQ
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Subject</th>
                  <th>Error</th>
                  <th>Intentos</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDlq.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      Aún no hay entradas en DLQ (o todos los pagos están pasando).
                    </td>
                  </tr>
                ) : (
                  data.recentDlq.map((row) => (
                    <tr key={row.id}>
                      <td>{row.orderId}</td>
                      <td>{row.originalSubject}</td>
                      <td>
                        <span className="pill danger">{row.error}</span>
                      </td>
                      <td>{row.attempts}</td>
                      <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="footer">Última actualización: {new Date(data.fetchedAt).toLocaleString()} · refresco 2s</p>
        </>
      ) : !err ? (
        <p className="muted">Cargando…</p>
      ) : null}
    </main>
  );
}
