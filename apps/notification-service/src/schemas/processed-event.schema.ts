import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProcessedEventDocument = HydratedDocument<ProcessedEvent>;

@Schema({ collection: 'processed_events', timestamps: { createdAt: true, updatedAt: false } })
export class ProcessedEvent {
  @Prop({ required: true }) eventId: string;

  @Prop({ required: true }) consumer: string;

  @Prop({ required: true }) type: string;

  @Prop({ type: Object, required: true }) payload: Record<string, unknown>;

  @Prop({ required: true, enum: ['processed', 'failed'] }) status: string;
}

export const ProcessedEventSchema = SchemaFactory.createForClass(ProcessedEvent);

ProcessedEventSchema.index({ eventId: 1, consumer: 1 }, { unique: true });
