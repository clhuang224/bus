import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { config as dotenvConfig } from 'dotenv'
import { AppModule } from './app.module.js'

dotenvConfig({ path: '.env' })
dotenvConfig({ path: '.env.local', override: true })

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')

  const config = new DocumentBuilder()
    .setTitle('Finding the Bus API')
    .setDescription(
      [
        'Contract-first backend API for Finding the Bus.',
        'The current API surface defines page-ready route, station, realtime, and admin sync contracts before the database sync layer is implemented.',
        'Favorite and settings contracts are backlog placeholders until account/auth work starts.',
      ].join(' '),
    )
    .setVersion('1.0.0')
    .addTag('system', 'Service health and operational endpoints.')
    .addTag('routes', 'Route list and route detail contracts.')
    .addTag('stations', 'Station and nearby station contracts.')
    .addTag('realtime', 'Polling-friendly realtime snapshot contracts.')
    .addTag('admin', 'Administrative base-data sync endpoints.')
    .addTag(
      'favorite',
      'WARNING: Backlog placeholder. Favorite APIs require account/auth work before entering the first backend scope.',
    )
    .addTag(
      'settings',
      'WARNING: Backlog placeholder. Settings APIs require account/auth work before entering the first backend scope.',
    )
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
