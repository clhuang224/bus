import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { SyncResourceType, SyncStatusType } from '@bus/shared'
import { createE2eApp } from './create-e2e-app.js'

interface SyncResponseBody {
  uuid: string | null
  resource: SyncResourceType
  status: SyncStatusType
  started_at: string | null
  finished_at: string | null
  records_read: number
  records_created: number
  records_updated: number
  records_deactivated: number
  error_message: string | null
}

function expectQueuedSyncResponse(
  body: SyncResponseBody,
  resource: SyncResourceType,
) {
  expect(body).toEqual({
    uuid: null,
    resource,
    status: SyncStatusType.QUEUED,
    started_at: null,
    finished_at: null,
    records_read: 0,
    records_created: 0,
    records_updated: 0,
    records_deactivated: 0,
    error_message: null,
  })
}

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
      .expect(({ body }: { body: SyncResponseBody }) => {
        expectQueuedSyncResponse(body, SyncResourceType.ROUTES)
      })
  })

  it('/api/admin/sync/stops (POST) queues stop sync', () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .post('/api/admin/sync/stops')
      .expect(200)
      .expect(({ body }: { body: SyncResponseBody }) => {
        expectQueuedSyncResponse(body, SyncResourceType.STOPS)
      })
  })
})
