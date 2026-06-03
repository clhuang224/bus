import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createE2eApp } from './create-e2e-app.js'

describe('Health API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createE2eApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/health (GET)', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }: { body: { status: string; timestamp: string } }) => {
        expect(body.status).toBe('ok')
        expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
      })
  })
})
