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
      ].join('\n\n'),
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
    .addTag(
      'Shared Response Envelopes',
      [
        '## Shared Response Envelopes',
        'Successful responses use `{ status, message, data }`. Error responses use `{ status, error: { code, message } }`, where `code` is one of the project `ErrorCode` enum values.',
      ].join('\n\n'),
    )
    .addTag(
      'Common Errors',
      [
        '## Common Errors',
        'These errors apply across the API and are documented here instead of being repeated on every endpoint.',
        [
          '| HTTP status | Error code | Meaning |',
          '| --- | --- | --- |',
          '| 400 | `SYSTEM_BAD_REQUEST` | Request validation, query parsing, or body parsing failed. |',
          '| 401 | `SYSTEM_UNAUTHORIZED` | Authentication or an admin API key is required. |',
          '| 403 | `SYSTEM_FORBIDDEN` | The caller is not allowed to perform the action. |',
          '| 404 | `SYSTEM_NOT_FOUND` | The requested API path does not exist, or a generic resource is missing. |',
          '| 409 | `SYSTEM_CONFLICT` | The request conflicts with the current resource or sync state. |',
          '| 500 | `SYSTEM_INTERNAL_SERVER_ERROR` | An unexpected server error occurred. |',
        ].join('\n'),
        'Endpoint-specific errors, such as `ROUTE_NOT_FOUND`, remain documented on the endpoint that can emit them.',
      ].join('\n\n'),
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
