import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventRecordDocument = HydratedDocument<EventRecord>;

@Schema({ collection: 'event_records', timestamps: { createdAt: true, updatedAt: false } })
export class EventRecord {
  @Prop({ required: true }) eventId: string;

  @Prop({ required: true }) type: string;

  @Prop({ type: Object, required: true }) payload: Record<string, unknown>;

  @Prop({ required: true, enum: ['processed', 'failed'] }) status: string;

  /** Quién registró el evento (p. ej. order-service, payment-service). */
  @Prop() producer?: string;
}

export const EventRecordSchema = SchemaFactory.createForClass(EventRecord);

EventRecordSchema.index({ eventId: 1, producer: 1 }, { unique: true, sparse: true });
