import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** OpenAPI 3.0 del dashboard (único endpoint HTTP de la app Next). */
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Dashboard API',
    description:
      'Métricas agregadas y últimos registros DLQ (demo). Requiere `MONGODB_URI` en el servidor.',
    version: '1.0.0',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local' },
    { url: 'http://dashboard:3001', description: 'Docker Compose (red interna)' },
  ],
  paths: {
    '/api/stats': {
      get: {
        operationId: 'getStats',
        summary: 'Estadísticas y DLQ recientes',
        tags: ['stats'],
        responses: {
          '200': {
            description: 'Agregados desde MongoDB',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StatsResponse' },
              },
            },
          },
          '500': {
            description: 'Error (p. ej. sin MONGODB_URI o Mongo caído)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { error: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      StatsResponse: {
        type: 'object',
        properties: {
          windowSeconds: { type: 'integer', example: 60 },
          eventsLastMinute: { type: 'integer' },
          eventsPerSecond: { type: 'number' },
          byMetricName: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
          totals: {
            type: 'object',
            properties: {
              orders: { type: 'integer' },
              dlq: { type: 'integer' },
              processedEvents: { type: 'integer' },
            },
          },
          recentDlq: {
            type: 'array',
            items: { $ref: '#/components/schemas/DlqRow' },
          },
          fetchedAt: { type: 'string', format: 'date-time' },
        },
      },
      DlqRow: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          originalSubject: { type: 'string' },
          originalEventId: { type: 'string' },
          orderId: { type: 'string' },
          error: { type: 'string' },
          attempts: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
} as const;

export async function GET() {
  return NextResponse.json(spec);
}
