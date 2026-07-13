import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import {
  ErrorCode,
  type ApiErrorResponse,
  type ApiSuccessResponse,
} from '@bus/shared'
import type { StationsResponseDto } from '../src/stations/dto/stations-response.dto.js'
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
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 24.9939, longitude: 121.5047 })
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<StationsResponseDto> }) => {
        expect(Array.isArray(body.data.stations)).toBe(true)
      })
  })

  it('/api/stations (GET) rejects requests without latitude', () => {
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ longitude: 121.5047 })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.SYSTEM_BAD_REQUEST)
      })
  })

  it('/api/stations (GET) rejects requests without longitude', () => {
    return request(app.getHttpServer())
      .get('/api/stations')
      .query({ latitude: 24.9939 })
      .expect(400)
      .expect(({ body }: { body: ApiErrorResponse }) => {
        expect(body.error.code).toBe(ErrorCode.SYSTEM_BAD_REQUEST)
      })
  })
})
