import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppLocaleType } from '@bus/shared'
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
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/settings')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { locale: AppLocaleType; share_usage_data: boolean }
        }) => {
          expect(body.locale).toBe(AppLocaleType.ZH_TW)
          expect(body.share_usage_data).toBe(true)
        },
      )
  })

  it('/api/settings (PATCH) updates provided settings fields', () => {
    const payload = {
      locale: AppLocaleType.EN,
      share_usage_data: false,
    }

    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .patch('/api/settings')
      .send(payload)
      .expect(200)
      .expect(({ body }: { body: typeof payload }) => {
        expect(body).toEqual(payload)
      })
  })

  it('/api/settings (PATCH) falls back when the payload does not match the contract', () => {
    const payload = {
      locale: 'invalid',
      share_usage_data: 'yes',
    }

    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .patch('/api/settings')
      .send(payload)
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: { locale: AppLocaleType; share_usage_data: boolean }
        }) => {
          expect(body.locale).toBe(AppLocaleType.ZH_TW)
          expect(body.share_usage_data).toBe(true)
        },
      )
  })
})
