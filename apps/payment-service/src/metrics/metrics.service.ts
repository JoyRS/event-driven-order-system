import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetricEvent } from './metric-event.schema';

const SERVICE = 'payment-service';

@Injectable()
export class MetricsService {
  constructor(@InjectModel(MetricEvent.name) private readonly model: Model<MetricEvent>) {}

  async record(name: string, meta?: Record<string, unknown>) {
    try {
      await this.model.create({ service: SERVICE, name, meta });
    } catch {
      /* métricas best-effort */
    }
  }
}
