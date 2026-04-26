import { EventSubject, OrderCreatedPayload } from '@eds/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { MetricsService } from '../metrics/metrics.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { EventRecord } from './schemas/event-record.schema';
import { Order } from './schemas/order.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(EventRecord.name) private readonly eventRecordModel: Model<EventRecord>,
    @Inject('NATS_CLIENT') private readonly nats: ClientProxy,
    private readonly metrics: MetricsService,
  ) {}

  async create(dto: CreateOrderDto) {
    const currency = dto.currency ?? 'EUR';
    const totalAmount = dto.items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);

    const order = await this.orderModel.create({
      customerId: dto.customerId,
      items: dto.items,
      totalAmount,
      currency,
      status: 'pending_payment',
    });

    const correlationId = uuid();
    const eventId = uuid();

    const payload: OrderCreatedPayload = {
      eventId,
      correlationId,
      orderId: String(order._id),
      customerId: dto.customerId,
      totalAmount,
      currency,
      createdAt: new Date().toISOString(),
      items: dto.items.map((i) => ({ sku: i.sku, qty: i.qty, unitPrice: i.unitPrice })),
    };

    await this.eventRecordModel.create({
      eventId,
      type: EventSubject.ORDER_CREATED,
      payload: payload as unknown as Record<string, unknown>,
      status: 'processed',
      producer: 'order-service',
    });

    await firstValueFrom(this.nats.emit(EventSubject.ORDER_CREATED, payload));

    await this.metrics.record('order.created.published', {
      eventId,
      orderId: String(order._id),
      correlationId,
    });

    console.log(`[Order] Order created: ${order._id} (correlationId=${correlationId})`);
    console.log(`[Event] ${EventSubject.ORDER_CREATED} published (eventId=${eventId})`);

    return {
      orderId: String(order._id),
      eventId,
      correlationId,
      totalAmount,
      currency,
      status: order.status,
    };
  }
}
