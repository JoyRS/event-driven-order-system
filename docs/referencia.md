# Referencia rápida

## Estructura del monorepo

```text
packages/event-contracts   # Tipos y subjects compartidos (+ helper TTL)
apps/order-service         # HTTP + NATS cliente
apps/payment-service       # Consumidor NATS
apps/notification-service  # Consumidor NATS + DLQ en Mongo
apps/dashboard             # Next.js: stats + Swagger UI
postman/                   # Colección Postman
scripts/                   # Carga de prueba (load-orders.mjs)
```

## Puertos habituales

| Servicio | Puerto | Notas |
|----------|--------|--------|
| Order Service | 3000 | REST, Swagger `/api/docs` |
| Dashboard | 3001 | UI principal, `/swagger`, `/api/stats` |
| MongoDB | 27017 | Expuesto en Compose para desarrollo |
| NATS | 4222 | Cliente; 8222 monitor (si está publicado) |

## Variables de entorno (resumen)

Definidas en [`.env.example`](../.env.example). Las más relevantes:

| Variable | Uso |
|----------|-----|
| `MONGODB_URI` | Todos los servicios que persisten o leen stats |
| `NATS_URL` | Order (publicar), Payment, Notification (consumir/publicar) |
| `PORT` | Order Service (default 3000) |
| `PAYMENT_FAILURE_RATE` | Probabilidad de fallo simulado (0–1) |
| `PAYMENT_MAX_RETRIES` | Reintentos antes de DLQ |
| `DEMO_RECORD_TTL_SECONDS` | TTL en Mongo (`0` desactiva creación del índice TTL en esquemas) |

## Scripts npm (raíz)

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila contratos, Nest apps y dashboard |
| `npm run dev:order` | Order en modo watch |
| `npm run dev:payment` | Payment en modo watch |
| `npm run dev:notification` | Notification en modo watch |
| `npm run dev:dashboard` | Next en :3001 |

## Documentación de API y pruebas

- **Swagger Order**: `http://localhost:3000/api/docs`  
- **OpenAPI JSON Order**: `/api/docs-json`  
- **Dashboard OpenAPI**: `http://localhost:3001/api/openapi`  
- **Postman**: importar `postman/event-driven-order-system.postman_collection.json`

## Docker

Desde la raíz del repo:

```bash
docker compose up --build
```

Alinea variables con `docker-compose.yml` para el comportamiento en contenedores (incluido TTL demo).
