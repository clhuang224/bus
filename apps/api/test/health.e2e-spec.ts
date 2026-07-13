import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { ApiSuccessResponse } from '@bus/shared'
import type { HealthResponseDto } from '../src/dto/health-response.dto.js'
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
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<HealthResponseDto> }) => {
        expect(body.status).toBe(200)
        expect(body.message).toBeNull()
        expect(body.data.status).toBe('ok')
        expect(new Date(body.data.timestamp).toISOString()).toBe(
          body.data.timestamp,
        )
      })
  })
})
