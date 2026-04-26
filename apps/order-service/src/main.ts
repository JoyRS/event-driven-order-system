import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Order Service API')
    .setDescription(
      'API HTTP de la demo **event-driven-order-system**. Los demás servicios (payment, notification) son consumidores NATS sin REST. El dashboard Next expone `GET /api/stats` en otro origen (puerto 3001).',
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Local')
    .addServer('http://order-service:3000', 'Docker Compose (red interna)')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json',
    yamlDocumentUrl: 'api/docs-yaml',
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`[Order] HTTP listening on ${port}`);
  console.log(`[Order] Swagger UI http://localhost:${port}/api/docs`);
}

bootstrap();
