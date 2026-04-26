import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  orderId: string;

  @ApiProperty({ format: 'uuid' })
  eventId: string;

  @ApiProperty({ format: 'uuid' })
  correlationId: string;

  @ApiProperty({ example: 29.97 })
  totalAmount: number;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiProperty({ example: 'pending_payment' })
  status: string;
}
