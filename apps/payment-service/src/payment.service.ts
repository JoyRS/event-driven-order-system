import {
  DeadLetterPayload,
  EventSubject,
  OrderCreatedPayload,
  PaymentCompletedPayload,
  PaymentFailedPayload,
} from '@eds/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { MetricsService } from './metrics/metrics.service';
import { ProcessedEvent } from './schemas/processed-event.schema';

const CONSUMER_ID = 'payment-service';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(ProcessedEvent.name) private readonly processedModel: Model<ProcessedEvent>,
    @Inject('NATS_CLIENT') private readonly nats: ClientProxy,
    private readonly metrics: MetricsService,
  ) {}

  async handleOrderCreated(orderEvent: OrderCreatedPayload) {
    const inboundEventId = orderEvent.eventId;

    const existing = await this.processedModel.findOne({
      eventId: inboundEventId,
      consumer: CONSUMER_ID,
    });
    if (existing) {
      console.log(
        `[Payment] Skip duplicate inbound event (idempotency) eventId=${inboundEventId} status=${existing.status}`,
      );
      return;
    }

    const maxRetries = Number(process.env.PAYMENT_MAX_RETRIES) || 3;
    const failureRate = Number(process.env.PAYMENT_FAILURE_RATE ?? 0.35);

    console.log(`[Payment] Processing payment for order ${orderEvent.orderId} (inboundEventId=${inboundEventId})`);

    let lastError = 'unknown';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[Payment] Attempt ${attempt}/${maxRetries}...`);
      try {
        const ok = this.simulateGateway(failureRate);
        if (!ok) {
          lastError = 'gateway_timeout';
          throw new Error('simulated_payment_failure');
        }

        const paymentId = uuid();
        const outEventId = uuid();
        const completed: PaymentCompletedPayload = {
          eventId: outEventId,
          correlationId: orderEvent.correlationId,
          orderId: orderEvent.orderId,
          paymentId,
          amount: orderEvent.totalAmount,
          currency: orderEvent.currency,
          completedAt: new Date().toISOString(),
        };

        await this.processedModel.create({
          eventId: inboundEventId,
          consumer: CONSUMER_ID,
          type: EventSubject.ORDER_CREATED,
          payload: orderEvent as unknown as Record<string, unknown>,
          status: 'processed',
        });

        await firstValueFrom(this.nats.emit(EventSubject.PAYMENT_COMPLETED, completed));
        await this.metrics.record('payment.completed.published', {
          orderId: orderEvent.orderId,
          paymentId,
          eventId: outEventId,
        });
        console.log(`[Event] ${EventSubject.PAYMENT_COMPLETED} published (eventId=${outEventId})`);
        return;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.warn(`[Payment] Attempt ${attempt} failed: ${lastError}`);
        if (attempt < maxRetries) {
          await sleep(150 * attempt);
        }
      }
    }

    const failed: PaymentFailedPayload = {
      eventId: uuid(),
      correlationId: orderEvent.correlationId,
      orderId: orderEvent.orderId,
      reason: lastError,
      failedAt: new Date().toISOString(),
      attempts: maxRetries,
    };

    await this.processedModel.create({
      eventId: inboundEventId,
      consumer: CONSUMER_ID,
      type: EventSubject.ORDER_CREATED,
      payload: orderEvent as unknown as Record<string, unknown>,
      status: 'failed',
    });

    const dlq: DeadLetterPayload = {
      originalSubject: EventSubject.ORDER_CREATED,
      originalEventId: inboundEventId,
      correlationId: orderEvent.correlationId,
      orderId: orderEvent.orderId,
      payload: orderEvent,
      error: lastError,
      failedAt: new Date().toISOString(),
      attempts: maxRetries,
    };

    await firstValueFrom(this.nats.emit(EventSubject.PAYMENT_FAILED, failed));
    await firstValueFrom(this.nats.emit(EventSubject.EVENTS_DLQ, dlq));
    await this.metrics.record('payment.failed.published', {
      orderId: orderEvent.orderId,
      eventId: failed.eventId,
      attempts: maxRetries,
    });
    await this.metrics.record('events.dlq.published', {
      orderId: orderEvent.orderId,
      originalEventId: inboundEventId,
    });
    console.error(`[Payment] Exhausted retries for order ${orderEvent.orderId}. DLQ + payment.failed emitted.`);
  }

  private simulateGateway(failureRate: number): boolean {
    if (failureRate <= 0) return true;
    if (failureRate >= 1) return false;
    return Math.random() > failureRate;
  }
}
