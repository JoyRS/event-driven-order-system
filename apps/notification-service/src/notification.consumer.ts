import {
  DeadLetterPayload,
  EventSubject,
  PaymentCompletedPayload,
  PaymentFailedPayload,
} from '@eds/contracts';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationConsumer {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(EventSubject.PAYMENT_COMPLETED)
  async onPaymentCompleted(@Payload() data: PaymentCompletedPayload) {
    await this.notificationService.handlePaymentCompleted(data);
  }

  @EventPattern(EventSubject.PAYMENT_FAILED)
  async onPaymentFailed(@Payload() data: PaymentFailedPayload) {
    await this.notificationService.handlePaymentFailed(data);
  }

  @EventPattern(EventSubject.EVENTS_DLQ)
  async onDeadLetter(@Payload() data: DeadLetterPayload) {
    await this.notificationService.handleDeadLetter(data);
  }
}
