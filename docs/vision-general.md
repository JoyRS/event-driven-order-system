# Visión general

## Qué es este repositorio

Es una **demo ejecutable** de un sistema de pedidos **orientado a eventos**: varios procesos colaboran sin acoplamiento HTTP directo entre ellos, usando un bus de mensajes (**NATS**) y una base compartida (**MongoDB**) para persistencia e idempotencia.

No pretende ser un producto listo para producción (sin auth avanzado, sin multi-región, etc.), pero sí mostrar patrones reales: publicación/consumo de eventos, reintentos, DLQ, métricas y retención de datos acotada.

## Qué problema ilustra

En arquitecturas síncronas, el servicio de pedidos tendría que llamar al de pagos y al de notificaciones en cadena. Aquí el **Order Service** solo crea el pedido y emite `order.created`; el **Payment Service** reacciona de forma asíncrona y el **Notification Service** reacciona al resultado del pago. Ese desacoplamiento es el núcleo del diseño.

## Qué puedes demostrar con esta demo

- Diseño **event-driven** con contratos explícitos (`@eds/contracts`).
- **Idempotencia** en consumidores (mismo `eventId` no se procesa dos veces de forma incorrecta).
- **Resiliencia** básica: reintentos en pago simulado y envío a **DLQ** tras agotarlos.
- **Observabilidad**: logs, colección de métricas, dashboard y Swagger en las APIs HTTP disponibles.
- **Operación local** homogénea con Docker Compose.

## Alcance consciente

Lo que **no** cubre la demo (y está bien para el objetivo): autenticación de usuarios, autorización fina, cifrado en tránsito entre todos los componentes, Sagas formales, outbox transaccional frente a Mongo, Kubernetes, etc. Esas extensiones se pueden discutir como evolución del diseño.
