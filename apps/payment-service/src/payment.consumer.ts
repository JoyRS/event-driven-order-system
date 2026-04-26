import { EventSubject, OrderCreatedPayload } from '@eds/contracts';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentConsumer {
  constructor(private readonly paymentService: PaymentService) {}

  @EventPattern(EventSubject.ORDER_CREATED)
  async onOrderCreated(@Payload() data: OrderCreatedPayload) {
    await this.paymentService.handleOrderCreated(data);
  }
}
