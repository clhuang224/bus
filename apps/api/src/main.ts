import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')

  const config = new DocumentBuilder()
    .setTitle('Finding the Bus API')
    .setDescription(
      [
        'Contract-first backend API for Finding the Bus.',
        'The current API surface defines page-ready route, stop, favorite, realtime, settings, and admin sync contracts before the database sync layer is implemented.',
      ].join(' '),
    )
    .setVersion('1.0.0')
    .addTag('system', 'Service health and operational endpoints.')
    .addTag('favorite', 'Favorite route and stop page contracts.')
    .addTag('nearby', 'Nearby stop contracts for location-based screens.')
    .addTag('stops', 'Stop detail contracts.')
    .addTag('routes', 'Route list and route detail contracts.')
    .addTag('realtime', 'Polling-friendly realtime snapshot contracts.')
    .addTag('settings', 'Client-facing sync and configuration state.')
    .addTag('admin', 'Administrative base-data sync endpoints.')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('openapi', app, document)

  app.use(
    '/reference',
    apiReference({
      pageTitle: 'Finding the Bus API Reference',
      theme: 'bluePlanet',
      url: '/openapi-json',
    }),
  )

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
