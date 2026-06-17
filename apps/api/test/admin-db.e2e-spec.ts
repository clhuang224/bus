import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { SyncResourceType, SyncStatusType } from '@bus/shared'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { createDbE2eApp } from './create-db-e2e-app.js'

interface SyncResponseBody {
  uuid: string
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

describe('Admin Sync API database flow (e2e)', () => {
  let app: INestApplication
  let prismaService: PrismaService
  const createdSyncRunIds: string[] = []

  beforeEach(async () => {
    app = await createDbE2eApp()
    prismaService = app.get(PrismaService)
  })

  afterEach(async () => {
    if (createdSyncRunIds.length > 0) {
      await prismaService.syncRun.deleteMany({
        where: {
          id: {
            in: createdSyncRunIds,
          },
        },
      })
      createdSyncRunIds.length = 0
    }

    await app.close()
  })

  it('/api/admin/sync/routes (POST) persists a queued sync run', async () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(app.getHttpServer())
      .post('/api/admin/sync/routes')
      .expect(200)

    const body = response.body as unknown as SyncResponseBody

    expect(typeof body.uuid).toBe('string')
    expect(body).toEqual({
      uuid: body.uuid,
      resource: SyncResourceType.ROUTES,
      status: SyncStatusType.QUEUED,
      started_at: null,
      finished_at: null,
      records_read: 0,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
      error_message: null,
    })

    createdSyncRunIds.push(body.uuid)

    const syncRun = await prismaService.syncRun.findUnique({
      where: {
        id: body.uuid,
      },
    })

    expect(syncRun).toMatchObject({
      id: body.uuid,
      resource: 'ROUTES',
      status: 'QUEUED',
      records_read: 0,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
      error_message: null,
    })
  })
})
