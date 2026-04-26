import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto } from './dto/create-order-response.dto';
import { OrderService } from './order.service';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Crear pedido', description: 'Persiste el pedido y publica el evento `order.created` en NATS.' })
  @ApiCreatedResponse({ type: CreateOrderResponseDto })
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }
}
