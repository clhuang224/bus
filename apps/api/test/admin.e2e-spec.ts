import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { SyncResourceType, SyncStatusType } from '@bus/shared'
import {
  SyncResourceType as PrismaSyncResourceType,
  SyncStatusType as PrismaSyncStatusType,
} from '../src/generated/prisma/enums.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { createE2eApp } from './create-e2e-app.js'

const syncRunUuid = '550e8400-e29b-41d4-a716-446655440000'
const syncRunCreatedAt = new Date('2026-06-16T00:00:00.000Z')

function createMockSyncRun(resource: PrismaSyncResourceType) {
  return {
    id: syncRunUuid,
    resource,
    status: PrismaSyncStatusType.QUEUED,
    started_at: null,
    finished_at: null,
    records_read: 0,
    records_created: 0,
    records_updated: 0,
    records_deactivated: 0,
    error_message: null,
    created_at: syncRunCreatedAt,
    updated_at: syncRunCreatedAt,
  }
}

function createMockPrismaService() {
  const createCalls: Array<{
    data: {
      resource: PrismaSyncResourceType
      status: PrismaSyncStatusType
    }
  }> = []

  return {
    syncRun: {
      create({
        data,
      }: {
        data: {
          resource: PrismaSyncResourceType
          status: PrismaSyncStatusType
        }
      }) {
        createCalls.push({ data })
        return Promise.resolve(createMockSyncRun(data.resource))
      },
    },
    createCalls,
  }
}

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
    uuid: syncRunUuid,
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
  let prismaService: ReturnType<typeof createMockPrismaService>

  beforeEach(async () => {
    prismaService = createMockPrismaService()
    app = await createE2eApp({
      configureModule: (builder) =>
        builder.overrideProvider(PrismaService).useValue(prismaService),
    })
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
        expect(prismaService.createCalls).toEqual([
          {
            data: {
              resource: PrismaSyncResourceType.ROUTES,
              status: PrismaSyncStatusType.QUEUED,
            },
          },
        ])
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
        expect(prismaService.createCalls).toEqual([
          {
            data: {
              resource: PrismaSyncResourceType.STOPS,
              status: PrismaSyncStatusType.QUEUED,
            },
          },
        ])
      })
  })
})
