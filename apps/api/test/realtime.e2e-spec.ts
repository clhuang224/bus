import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createE2eApp } from './create-e2e-app.js'

describe('Realtime API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createE2eApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/realtime/routes/:uuid (GET) returns a polling snapshot', () => {
    const routeUuid = 'route-1'

    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get(`/api/realtime/routes/${routeUuid}`)
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            uuid: string
            arrivals: unknown[]
            vehicles: unknown[]
            updated_at: string
          }
        }) => {
          expect(body.uuid).toBe(routeUuid)
          expect(Array.isArray(body.arrivals)).toBe(true)
          expect(Array.isArray(body.vehicles)).toBe(true)
          expect(typeof body.updated_at).toBe('string')
        },
      )
  })
})
