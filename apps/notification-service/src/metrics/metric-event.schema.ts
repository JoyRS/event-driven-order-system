import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MetricEventDocument = HydratedDocument<MetricEvent>;

@Schema({ collection: 'metric_events', timestamps: { createdAt: true, updatedAt: false } })
export class MetricEvent {
  @Prop({ required: true }) service: string;

  @Prop({ required: true }) name: string;

  @Prop({ type: Object }) meta?: Record<string, unknown>;
}

export const MetricEventSchema = SchemaFactory.createForClass(MetricEvent);

MetricEventSchema.index({ createdAt: -1 });
MetricEventSchema.index({ name: 1, createdAt: -1 });
