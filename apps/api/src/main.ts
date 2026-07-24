import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { config as dotenvConfig } from 'dotenv'
import { ADMIN_API_KEY_HEADER } from './admin/admin-api-key.guard.js'
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
        'Backend API for Finding the Bus.',
        'The current API surface provides page-ready route, station, realtime, and admin sync endpoints while database-backed coverage continues to expand.',
        'Favorite and settings contracts are backlog placeholders until account/auth work starts.',
        'Successful responses use { status, message, data }. Error responses use { status, error: { code, message } }, where code is one of the project ErrorCode enum values.',
      ].join(' '),
    )
    .setVersion('1.0.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: ADMIN_API_KEY_HEADER,
        description: 'API key required by administrative endpoints.',
      },
      'adminApiKey',
    )
    .addTag('system', 'Service health and operational endpoints.')
    .addTag('routes', 'Database-backed route list and route detail endpoints.')
    .addTag('stations', 'Database-backed station and nearby station endpoints.')
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
