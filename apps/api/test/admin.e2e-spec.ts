import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { SyncResourceType, SyncStatusType } from '@bus/shared'
import { createE2eApp } from './create-e2e-app.js'

describe('Admin Sync API (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await createE2eApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('/api/admin/sync/routes (POST) queues route sync', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .post('/api/admin/sync/routes')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            uuid: string | null
            resource: SyncResourceType
            status: SyncStatusType
            created_at: string | null
          }
        }) => {
          expect(body.uuid).toBeNull()
          expect(body.resource).toBe(SyncResourceType.ROUTES)
          expect(body.status).toBe(SyncStatusType.QUEUED)
          expect(body.created_at).toBeNull()
        },
      )
  })

  it('/api/admin/sync/stops (POST) queues stop sync', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .post('/api/admin/sync/stops')
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            uuid: string | null
            resource: SyncResourceType
            status: SyncStatusType
            created_at: string | null
          }
        }) => {
          expect(body.uuid).toBeNull()
          expect(body.resource).toBe(SyncResourceType.STOPS)
          expect(body.status).toBe(SyncStatusType.QUEUED)
          expect(body.created_at).toBeNull()
        },
      )
  })
})
