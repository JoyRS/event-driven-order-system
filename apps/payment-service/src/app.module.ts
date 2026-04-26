import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricEvent, MetricEventSchema } from './metrics/metric-event.schema';
import { MetricsService } from './metrics/metrics.service';
import { PaymentConsumer } from './payment.consumer';
import { PaymentService } from './payment.service';
import { ProcessedEvent, ProcessedEventSchema } from './schemas/processed-event.schema';

const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/order_demo'),
    MongooseModule.forFeature([
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
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
  controllers: [PaymentConsumer],
  providers: [PaymentService, MetricsService],
})
export class AppModule {}
