export const EventSubject = {
  ORDER_CREATED: 'order.created',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  EVENTS_DLQ: 'events.dlq',
} as const;

export type EventSubjectType = (typeof EventSubject)[keyof typeof EventSubject];

export interface OrderItemPayload {
  sku: string;
  qty: number;
  unitPrice: number;
}

/** Mensaje publicado tras crear un pedido (incluye eventId para idempotencia downstream). */
export interface OrderCreatedPayload {
  eventId: string;
  correlationId: string;
  orderId: string;
  customerId: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: OrderItemPayload[];
}

export interface PaymentCompletedPayload {
  eventId: string;
  correlationId: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  completedAt: string;
}

export interface PaymentFailedPayload {
  eventId: string;
  correlationId: string;
  orderId: string;
  reason: string;
  failedAt: string;
  attempts: number;
}

export interface DeadLetterPayload {
  originalSubject: string;
  originalEventId: string;
  correlationId: string;
  orderId: string;
  payload: unknown;
  error: string;
  failedAt: string;
  attempts: number;
}
