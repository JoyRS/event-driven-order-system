import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetricEvent, MetricEventSchema } from './metrics/metric-event.schema';
import { MetricsService } from './metrics/metrics.service';
import { NotificationConsumer } from './notification.consumer';
import { NotificationService } from './notification.service';
import { DlqRecord, DlqRecordSchema } from './schemas/dlq-record.schema';
import { ProcessedEvent, ProcessedEventSchema } from './schemas/processed-event.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/order_demo'),
    MongooseModule.forFeature([
      { name: ProcessedEvent.name, schema: ProcessedEventSchema },
      { name: DlqRecord.name, schema: DlqRecordSchema },
      { name: MetricEvent.name, schema: MetricEventSchema },
    ]),
  ],
  controllers: [NotificationConsumer],
  providers: [NotificationService, MetricsService],
})
export class AppModule {}
