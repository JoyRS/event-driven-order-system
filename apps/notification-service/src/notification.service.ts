import { DeadLetterPayload, EventSubject, PaymentCompletedPayload, PaymentFailedPayload } from '@eds/contracts';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetricsService } from './metrics/metrics.service';
import { DlqRecord } from './schemas/dlq-record.schema';
import { ProcessedEvent } from './schemas/processed-event.schema';

const CONSUMER_ID = 'notification-service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(ProcessedEvent.name) private readonly processedModel: Model<ProcessedEvent>,
    @InjectModel(DlqRecord.name) private readonly dlqModel: Model<DlqRecord>,
    private readonly metrics: MetricsService,
  ) {}

  async handlePaymentCompleted(payload: PaymentCompletedPayload) {
    const inboundEventId = payload.eventId;
    const existing = await this.processedModel.findOne({
      eventId: inboundEventId,
      consumer: CONSUMER_ID,
    });
    if (existing) {
      console.log(`[Notification] Skip duplicate eventId=${inboundEventId}`);
      return;
    }

    await this.processedModel.create({
      eventId: inboundEventId,
      consumer: CONSUMER_ID,
      type: EventSubject.PAYMENT_COMPLETED,
      payload: payload as unknown as Record<string, unknown>,
      status: 'processed',
    });

    console.log(
      `[Notification] Sending confirmation to customer for order ${payload.orderId} (paymentId=${payload.paymentId})`,
    );
    console.log(`[Notification] Channel=log body=${JSON.stringify({ kind: 'order_paid', ...payload })}`);
    await this.metrics.record('notification.payment_completed', {
      orderId: payload.orderId,
      paymentId: payload.paymentId,
    });
  }

  async handlePaymentFailed(payload: PaymentFailedPayload) {
    const inboundEventId = payload.eventId;
    const existing = await this.processedModel.findOne({
      eventId: inboundEventId,
      consumer: CONSUMER_ID,
    });
    if (existing) {
      console.log(`[Notification] Skip duplicate failure eventId=${inboundEventId}`);
      return;
    }

    await this.processedModel.create({
      eventId: inboundEventId,
      consumer: CONSUMER_ID,
      type: EventSubject.PAYMENT_FAILED,
      payload: payload as unknown as Record<string, unknown>,
      status: 'processed',
    });

    console.warn(
      `[Notification] Payment failed for order ${payload.orderId}: ${payload.reason} (attempts=${payload.attempts})`,
    );
    console.log(`[Notification] Channel=log body=${JSON.stringify({ kind: 'payment_failed', ...payload })}`);
    await this.metrics.record('notification.payment_failed', {
      orderId: payload.orderId,
      reason: payload.reason,
    });
  }

  async handleDeadLetter(data: DeadLetterPayload) {
    try {
      await this.dlqModel.create({
        originalSubject: data.originalSubject,
        originalEventId: data.originalEventId,
        correlationId: data.correlationId,
        orderId: data.orderId,
        payload: data.payload as unknown as Record<string, unknown>,
        error: data.error,
        attempts: data.attempts,
      });
      console.error(
        `[DLQ] Persisted originalEventId=${data.originalEventId} orderId=${data.orderId} err=${data.error}`,
      );
      await this.metrics.record('dlq.persisted', {
        orderId: data.orderId,
        originalEventId: data.originalEventId,
      });
    } catch (e: unknown) {
      const code = e && typeof e === 'object' && 'code' in e ? (e as { code: number }).code : undefined;
      if (code === 11000) {
        console.log(`[DLQ] Skip duplicate originalEventId=${data.originalEventId}`);
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[DLQ] Failed to persist: ${msg}`);
    }
  }
}
