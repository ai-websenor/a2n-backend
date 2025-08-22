import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import swaggerOptions from './swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

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
