import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import swaggerOptions from './swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();

  
  const swaggerConfig = new DocumentBuilder()
    .setTitle(swaggerOptions.swaggerDefinition.info.title)
    .setDescription(swaggerOptions.swaggerDefinition.info.description)
    .setVersion(swaggerOptions.swaggerDefinition.info.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    explorer: true,
  });

  await app.listen(process.env.PORT ?? 8000);
}

bootstrap();
