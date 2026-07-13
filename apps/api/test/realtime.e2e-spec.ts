import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { ApiSuccessResponse } from '@bus/shared'
import type { RouteRealtimeResponseDto } from '../src/realtime/dto/route-realtime-response.dto.js'
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
    return request(app.getHttpServer())
      .get(`/api/realtime/routes/${routeUuid}`)
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<RouteRealtimeResponseDto> }) => {
          expect(body.data.uuid).toBe(routeUuid)
          expect(Array.isArray(body.data.arrivals)).toBe(true)
          expect(Array.isArray(body.data.vehicles)).toBe(true)
          expect(typeof body.data.updated_at).toBe('string')
        },
      )
  })
})
