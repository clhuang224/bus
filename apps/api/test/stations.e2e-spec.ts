import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createE2eApp } from './create-e2e-app.js'

describe('Stations API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createE2eApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/stations (GET) returns nearby station groups for valid coordinates', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 24.9939, longitude: 121.5047 })
      .expect(200)
      .expect(({ body }: { body: { stations: unknown[] } }) => {
        expect(Array.isArray(body.stations)).toBe(true)
      })
  })

  it('/api/stations (GET) rejects requests without latitude', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ longitude: 121.5047 })
      .expect(400)
  })

  it('/api/stations (GET) rejects requests without longitude', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 24.9939 })
      .expect(400)
  })
})
