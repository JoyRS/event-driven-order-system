import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ collection: 'orders', timestamps: true })
export class Order {
  @Prop({ required: true }) customerId: string;

  @Prop({
    type: [
      {
        sku: { type: String, required: true },
        qty: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
      },
    ],
    required: true,
  })
  items: { sku: string; qty: number; unitPrice: number }[];

  @Prop({ required: true }) totalAmount: number;

  @Prop({ default: 'EUR' }) currency: string;

  @Prop({ default: 'pending_payment' }) status: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
