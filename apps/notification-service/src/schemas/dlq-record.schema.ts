import { demoRecordTtlSeconds } from '@eds/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DlqRecordDocument = HydratedDocument<DlqRecord>;

@Schema({ collection: 'dlq_records', timestamps: true })
export class DlqRecord {
  @Prop({ required: true }) originalSubject: string;

  @Prop({ required: true }) originalEventId: string;

  @Prop({ required: true }) correlationId: string;

  @Prop({ required: true }) orderId: string;

  @Prop({ type: Object, required: true }) payload: Record<string, unknown>;

  @Prop({ required: true }) error: string;

  @Prop({ required: true }) attempts: number;
}

export const DlqRecordSchema = SchemaFactory.createForClass(DlqRecord);

DlqRecordSchema.index({ originalEventId: 1 }, { unique: true });

const ttlDlq = demoRecordTtlSeconds();
if (ttlDlq > 0) {
  DlqRecordSchema.index({ createdAt: 1 }, { expireAfterSeconds: ttlDlq });
}
