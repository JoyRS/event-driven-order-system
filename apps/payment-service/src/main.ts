import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.NATS,
    options: {
      servers: [natsUrl],
      queue: 'payment-workers',
    },
  });
  await app.listen();
  console.log(`[Payment] NATS consumer ready (${natsUrl}) queue=payment-workers`);
}

bootstrap();
