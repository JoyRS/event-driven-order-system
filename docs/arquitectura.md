# Arquitectura

## Vista de componentes

```text
                    HTTP POST /orders
Cliente / Postman ──────────────────► Order Service (Nest, :3000)
                                           │
                                           │ escribe orders, event_records, metric_events
                                           ▼
                                        MongoDB
                                           ▲
                                           │ processed_events, metric_events, dlq_records
                    NATS (order.created)   │
Payment Service ◄─────────────────────────┘
       │
       │ payment.completed | payment.failed | events.dlq
       ▼
Notification Service ─────────────────────► MongoDB (persistencia DLQ, métricas, processed)

Dashboard (Next, :3001) ─── solo lectura Mongo ───► métricas agregadas y tabla DLQ
```

Los servicios **Payment** y **Notification** no exponen REST público en esta demo: son **microservicios NATS** (colas `payment-workers` y `notification-workers`).

## Contratos de eventos

Los subjects y los payloads tipados viven en el paquete **`packages/event-contracts`** (`@eds/contracts`). Así se reduce el riesgo de “strings mágicos” dispersos y se documenta el contrato en código.

## Flujo feliz (resumido)

1. Se crea un pedido vía API; se guarda en `orders` y se publica `order.created` con un `eventId` único.
2. Payment consume el evento; si el pago simulado tiene éxito, marca el procesamiento en `processed_events` y publica `payment.completed`.
3. Notification consume `payment.completed`, registra idempotencia y escribe métricas; los logs simulan el envío al usuario.

## Errores y DLQ

El pago puede fallar de forma aleatoria (tasa configurable). Tras varios intentos, Payment publica `payment.failed` y **`events.dlq`**. El Notification Service persiste el mensaje en **`dlq_records`** (con idempotencia por `originalEventId`).

## Idempotencia

La colección **`processed_events`** usa un índice único `(eventId, consumer)` para que cada consumidor procese un evento entrante como mucho una vez en términos de negocio (éxito o fallo terminal según el flujo implementado).

## Retención de datos (demo)

Con **`DEMO_RECORD_TTL_SECONDS`** (por defecto 86400 = 24 h), MongoDB aplica **TTL** sobre `createdAt` en las colecciones principales de la demo, de modo que el entorno no crece sin límite. El borrado lo ejecuta el monitor TTL de Mongo (aprox. cada 60 segundos).

## APIs HTTP en el proyecto

| Superficie | Rol |
|------------|-----|
| Order Service | Crear pedidos, health, documentación Swagger |
| Dashboard | `GET /api/stats`, spec OpenAPI, UI en `/swagger` |

El resto del tráfico “de negocio” entre servicios es por **NATS**.
