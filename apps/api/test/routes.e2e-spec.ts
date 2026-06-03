import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AreaType } from '@bus/shared'
import { createE2eApp } from './create-e2e-app.js'

describe('Routes API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createE2eApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/routes (GET) returns route search results for a valid area', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/routes')
      .query({ area: AreaType.TAIPEI })
      .expect(200)
      .expect(({ body }: { body: { routes: unknown[] } }) => {
        expect(Array.isArray(body.routes)).toBe(true)
      })
  })

  it('/api/routes/:uuid (GET) returns route detail placeholder data', () => {
    const routeUuid = 'route-1'

    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get(`/api/routes/${routeUuid}`)
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            uuid: string
            city: string | null
            name: { 'zh-TW': string; en: string }
            sub_routes: unknown[]
          }
        }) => {
          expect(body.uuid).toBe(routeUuid)
          expect(body.city).toBeNull()
          expect(body.name).toEqual({ 'zh-TW': '', en: '' })
          expect(Array.isArray(body.sub_routes)).toBe(true)
        },
      )
  })

  it('/api/routes (GET) rejects requests without area', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer()).get('/api/routes').expect(400)
  })

  it('/api/routes (GET) rejects invalid area values', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/routes')
      .query({ area: 'InvalidArea' })
      .expect(400)
  })
})
