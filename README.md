# Event-Driven Order System

Demo funcional de un sistema de pedidos desacoplado con **NestJS**, **MongoDB**, **NATS**, **Next.js (dashboard)** y **Docker**.

**Documentación ampliada (visión, arquitectura y referencia):** carpeta [`docs/`](./docs/README.md).

## Requisitos

- Node.js 18+
- Docker y Docker Compose (para ejecutar todo el stack)

## Inicio rápido

```bash
cp .env.example .env
npm install
npm run build
docker compose up --build
```

Crear un pedido:

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d "{\"customerId\":\"cust-1\",\"items\":[{\"sku\":\"A1\",\"qty\":2,\"unitPrice\":10}]}"
```

Ver logs de los contenedores `payment-service` y `notification-service` para el flujo completo.

**Dashboard** (métricas ~eventos/s en ventana de 60s, desglose por nombre de métrica y tabla DLQ): [http://localhost:3001](http://localhost:3001)

**Swagger / OpenAPI**

- **Order Service**: UI en [http://localhost:3000/api/docs](http://localhost:3000/api/docs) · JSON [http://localhost:3000/api/docs-json](http://localhost:3000/api/docs-json) · YAML [http://localhost:3000/api/docs-yaml](http://localhost:3000/api/docs-yaml)
- **Dashboard**: UI en [http://localhost:3001/swagger](http://localhost:3001/swagger) · spec [http://localhost:3001/api/openapi](http://localhost:3001/api/openapi)

**Postman**: importar `postman/event-driven-order-system.postman_collection.json` (variables `orderBaseUrl`, `dashboardBaseUrl`). También puedes generar la colección desde el OpenAPI del order-service: Importar → pegar URL de `/api/docs-json`.

Carga rápida (requiere Node 18+ con `fetch` global, o ejecutar desde un runtime compatible):

```bash
node scripts/load-orders.mjs 30 http://localhost:3000
```

### Desarrollo local (sin Docker en los servicios)

Levanta solo infraestructura:

```bash
docker compose up mongo nats -d
```

En cuatro terminales (servicios + dashboard):

```bash
npm run dev:order
npm run dev:payment
npm run dev:notification
npm run dev:dashboard
```

---

## Demo Scope & Implementation Guide

> Este proyecto es una **demo funcional** orientada a demostrar diseño de sistemas distribuidos basados en eventos.  
> No busca cubrir todos los casos de producción, sino evidenciar decisiones técnicas, arquitectura y flujo real de eventos.

---

## Objetivo del proyecto

Implementar un sistema de procesamiento de pedidos desacoplado, donde múltiples servicios colaboran mediante eventos.

El sistema debe ser:

- Ejecutable localmente
- Observable (logs claros)
- Extensible
- Fácil de entender para evaluación técnica

---

## Stack obligatorio

### Backend

- NestJS
- MongoDB
- NATS (event broker)

### Infraestructura

- Docker + Docker Compose

### Opcional (recomendado)

- Redis (caching o scaling)
- **Next.js**: incluido como `apps/dashboard` (métricas + DLQ)

---

## Qué se implementa

### 1. Servicios

Cada servicio es independiente:

- **Order Service** — Crear pedidos; publicar `order.created`
- **Payment Service** — Consumir `order.created`; simular pago; emitir `payment.completed` o `payment.failed` (con reintentos y DLQ)
- **Notification Service** — Consumir resultados de pago; simular notificaciones (logs); **consumir `events.dlq`** y persistir en `dlq_records`
- **Dashboard (Next.js)** — Lectura de Mongo: conteos, eventos/minuto (colección `metric_events`), últimos DLQ

### 2. Comunicación por eventos

- NATS como broker
- Eventos tipados (`@eds/contracts`)
- Publicación y suscripción desacoplada

### 3. Persistencia (MongoDB)

- Pedidos y registro de eventos procesados / publicados
- **Retención demo (24 h):** índices **TTL** sobre `createdAt` en `orders`, `event_records`, `processed_events`, `metric_events` y `dlq_records`. MongoDB elimina documentos cuando `createdAt` supera el umbral (por defecto **86400 s**). El monitor TTL corre aprox. cada 60 s. Variable: `DEMO_RECORD_TTL_SECONDS` (`0` desactiva el índice TTL al arrancar los esquemas; en bases ya existentes puede hacer falta ajustar índices a mano).
- Estructura mínima del registro de eventos:

```json
{
  "eventId": "uuid",
  "type": "event.name",
  "payload": {},
  "status": "processed | failed",
  "createdAt": "ISODate"
}
```

### 4. Manejo de errores

- Reintentos configurables en Payment Service
- Logs claros de fallo
- Simulación de errores aleatorios en el pago
- **DLQ** (`events.dlq`) tras agotar reintentos

### 5. Idempotencia

- `eventId` único por mensaje de dominio
- Índice único compuesto `(eventId, consumer)` para evitar doble procesamiento

### 6. Observabilidad (extras implementados)

- **Métricas**: cada servicio escribe puntos en `metric_events` (best-effort, no bloquea el flujo).
- **Throughput**: el dashboard calcula eventos en la **última ventana de 60s** y un promedio **eventos/s** sobre esa ventana.
- **DLQ durable**: el notification-service persiste mensajes `events.dlq` con idempotencia por `originalEventId`.

---

## Logs esperados (ilustrativo)

```text
[Order] Order created: ...
[Event] order.created published (eventId=...)

[Payment] Processing payment for order ...
[Payment] Attempt 1/3 ...
[Event] payment.completed published

[Notification] Sending confirmation for order ...
```

---

## Qué NO es necesario en esta demo

- UI compleja
- Autenticación
- Seguridad avanzada
- Kubernetes (opcional como mejora)

---

## Arquitectura (resumen)

```text
[Client] --HTTP POST--> [Order Service] --NATS: order.created--> [Payment Service]
                                                                      |
                                      NATS: payment.*  <--------------+
                                              |
                                              v
                                    [Notification Service] --persist--> MongoDB `dlq_records`
                                              ^
[Browser] ----HTTP----> [Dashboard :3001] ----Mongo----> métricas + DLQ
```

Todos los servicios comparten MongoDB (base `order_demo`) con colecciones separadas por responsabilidad.

---

## Licencia

MIT
