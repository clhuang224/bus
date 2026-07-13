import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppLocaleType, type ApiSuccessResponse } from '@bus/shared'
import type {
  SettingsResponseDto,
  UpdateSettingsRequestDto,
} from '../src/settings/dto/settings-response.dto.js'
import { createE2eApp } from './create-e2e-app.js'

describe('Settings API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createE2eApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/settings (GET) returns the current settings placeholder', () => {
    return request(app.getHttpServer())
      .get('/api/settings')
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<SettingsResponseDto> }) => {
        expect(body.data.locale).toBe(AppLocaleType.ZH_TW)
        expect(body.data.share_usage_data).toBe(true)
      })
  })

  it('/api/settings (PATCH) updates provided settings fields', () => {
    const payload: UpdateSettingsRequestDto = {
      locale: AppLocaleType.EN,
      share_usage_data: false,
    }
    return request(app.getHttpServer())
      .patch('/api/settings')
      .send(payload)
      .expect(200)
      .expect(
        ({ body }: { body: ApiSuccessResponse<UpdateSettingsRequestDto> }) => {
          expect(body.data).toEqual(payload)
        },
      )
  })

  it('/api/settings (PATCH) falls back when the payload does not match the contract', () => {
    const payload = {
      locale: 'invalid',
      share_usage_data: 'yes',
    }
    return request(app.getHttpServer())
      .patch('/api/settings')
      .send(payload)
      .expect(200)
      .expect(({ body }: { body: ApiSuccessResponse<SettingsResponseDto> }) => {
        expect(body.data.locale).toBe(AppLocaleType.ZH_TW)
        expect(body.data.share_usage_data).toBe(true)
      })
  })
})
