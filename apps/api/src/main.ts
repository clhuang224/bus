import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Finding the Bus API')
    .setDescription('Backend API documentation')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('openapi', app, document);

  app.use(
    '/reference',
    apiReference({
      theme: 'bluePlanet',
      url: '/openapi-json',
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
