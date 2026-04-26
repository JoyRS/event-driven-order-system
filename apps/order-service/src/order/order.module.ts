import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricsService } from '../metrics/metrics.service';
import { MetricEvent, MetricEventSchema } from '../metrics/metric-event.schema';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { EventRecord, EventRecordSchema } from './schemas/event-record.schema';
import { Order, OrderSchema } from './schemas/order.schema';

const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: EventRecord.name, schema: EventRecordSchema },
      { name: MetricEvent.name, schema: MetricEventSchema },
    ]),
    ClientsModule.register([
      {
        name: 'NATS_CLIENT',
        transport: Transport.NATS,
        options: { servers: [natsUrl] },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, MetricsService],
})
export class OrderModule {}
