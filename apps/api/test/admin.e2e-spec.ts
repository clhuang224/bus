import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { CityNameType, SyncResourceType, SyncStatusType } from '@bus/shared'
import {
  CityNameType as PrismaCityNameType,
  SyncResourceType as PrismaSyncResourceType,
  SyncStatusType as PrismaSyncStatusType,
} from '../src/generated/prisma/enums.js'
import { PrismaService } from '../src/prisma/prisma.service.js'
import { SyncService } from '../src/sync/sync.service.js'
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
    resume_after_at: null,
    records_read: 0,
    records_created: 0,
    records_updated: 0,
    records_deactivated: 0,
    error_message: null,
    created_at: syncRunCreatedAt,
    updated_at: syncRunCreatedAt,
  }
}

function createMockSyncRunCity() {
  return {
    id: '660e8400-e29b-41d4-a716-446655440000',
    sync_run_id: syncRunUuid,
    city: PrismaCityNameType.TAIPEI,
    status: PrismaSyncStatusType.SUCCEEDED,
    started_at: new Date('2026-06-16T00:01:00.000Z'),
    finished_at: new Date('2026-06-16T00:02:00.000Z'),
    records_read: 10,
    records_created: 7,
    records_updated: 3,
    records_deactivated: 0,
    error_message: null,
    created_at: new Date('2026-06-16T00:00:30.000Z'),
    updated_at: new Date('2026-06-16T00:02:00.000Z'),
  }
}

function createMockPrismaService() {
  let activeSyncRun: ReturnType<typeof createMockSyncRun> | null = null
  const advisoryLockQueries: string[] = []
  const createCalls: Array<{
    data: {
      resource: PrismaSyncResourceType
      status: PrismaSyncStatusType
    }
  }> = []
  const updateCalls: unknown[] = []

  const transaction = {
    $executeRaw(strings: TemplateStringsArray, ...values: unknown[]) {
      advisoryLockQueries.push(renderSql(strings, values))
      return Promise.resolve(0)
    },
    syncRun: {
      findFirst() {
        return Promise.resolve(activeSyncRun)
      },
      create({
        data,
      }: {
        data: {
          resource: PrismaSyncResourceType
          status: PrismaSyncStatusType
        }
      }) {
        createCalls.push({ data })
        activeSyncRun = createMockSyncRun(data.resource)
        return Promise.resolve(activeSyncRun)
      },
      update(args: {
        where: { id: string }
        data: Partial<ReturnType<typeof createMockSyncRun>>
      }) {
        updateCalls.push(args)

        if (!activeSyncRun) {
          return Promise.reject(new Error('No sync run to update.'))
        }

        activeSyncRun = { ...activeSyncRun, ...args.data }
        return Promise.resolve(activeSyncRun)
      },
    },
  }

  return {
    $transaction<T>(
      callback: (client: typeof transaction) => Promise<T>,
    ): Promise<T> {
      return callback(transaction)
    },
    advisoryLockQueries,
    createCalls,
    syncRun: {
      findMany() {
        return Promise.resolve(activeSyncRun ? [activeSyncRun] : [])
      },
      findFirst({
        where,
      }: {
        where: {
          id: string
          resource: { in: PrismaSyncResourceType[] }
        }
      }) {
        if (
          !activeSyncRun ||
          activeSyncRun.id !== where.id ||
          !where.resource.in.includes(activeSyncRun.resource)
        ) {
          return Promise.resolve(null)
        }

        return Promise.resolve({
          ...activeSyncRun,
          cities: [createMockSyncRunCity()],
        })
      },
    },
    setLatestSyncRunStatus(status: PrismaSyncStatusType) {
      if (!activeSyncRun) throw new Error('No sync run to update.')
      activeSyncRun.status = status
    },
    updateCalls,
  }
}

function renderSql(strings: TemplateStringsArray, values: unknown[]): string {
  return strings
    .reduce(
      (sql, segment, index) =>
        `${sql}${segment}${index < values.length ? String(values[index]) : ''}`,
      '',
    )
    .replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim()
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

interface SyncRunSummaryResponseBody extends SyncResponseBody {
  uuid: string
  created_at: string
  updated_at: string
  resume_after_at: string | null
}

interface SyncRunDetailResponseBody extends SyncRunSummaryResponseBody {
  cities: Array<{
    city: CityNameType
    status: SyncStatusType
    started_at: string | null
    finished_at: string | null
    updated_at: string
    records_read: number
    records_created: number
    records_updated: number
    records_deactivated: number
    error_message: string | null
  }>
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
  let enqueuedSyncRunIds: string[]

  beforeEach(async () => {
    prismaService = createMockPrismaService()
    enqueuedSyncRunIds = []
    app = await createE2eApp({
      configureModule: (builder) =>
        builder
          .overrideProvider(PrismaService)
          .useValue(prismaService)
          .overrideProvider(SyncService)
          .useValue({
            enqueue: (syncRunId: string) => {
              enqueuedSyncRunIds.push(syncRunId)
            },
          }),
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
        expect(enqueuedSyncRunIds).toEqual([syncRunUuid])
        expect(prismaService.advisoryLockQueries).toEqual([
          'SELECT pg_advisory_xact_lock(1, 1)',
        ])
      })
  })

  it('/api/admin/sync/routes (POST) reuses an active route sync', async () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post('/api/admin/sync/routes')
      .expect(200)
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post('/api/admin/sync/routes')
      .expect(200)
      .expect(({ body }: { body: SyncResponseBody }) => {
        expectQueuedSyncResponse(body, SyncResourceType.ROUTES)
      })

    expect(prismaService.createCalls).toHaveLength(1)
    expect(prismaService.advisoryLockQueries).toHaveLength(2)
    expect(enqueuedSyncRunIds).toEqual([syncRunUuid, syncRunUuid])
  })

  it('/api/admin/sync/routes (POST) resumes the latest failed route sync', async () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post('/api/admin/sync/routes')
      .expect(200)

    prismaService.setLatestSyncRunStatus(PrismaSyncStatusType.FAILED)

    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post('/api/admin/sync/routes')
      .expect(200)
      .expect(({ body }: { body: SyncResponseBody }) => {
        expectQueuedSyncResponse(body, SyncResourceType.ROUTES)
      })

    expect(prismaService.createCalls).toHaveLength(1)
    expect(prismaService.updateCalls).toEqual([
      {
        where: { id: syncRunUuid },
        data: {
          status: PrismaSyncStatusType.QUEUED,
          started_at: null,
          finished_at: null,
          resume_after_at: null,
          error_message: null,
        },
      },
    ])
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
        expect(enqueuedSyncRunIds).toEqual([syncRunUuid])
        expect(prismaService.advisoryLockQueries).toEqual([
          'SELECT pg_advisory_xact_lock(1, 2)',
        ])
      })
  })

  it('/api/admin/sync/runs (GET) lists recent sync runs', async () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer()).post('/api/admin/sync/stops').expect(200)

    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .get('/api/admin/sync/runs')
      .expect(200)
      .expect(({ body }: { body: SyncRunSummaryResponseBody[] }) => {
        expect(body).toEqual([
          {
            uuid: syncRunUuid,
            resource: SyncResourceType.STOPS,
            status: SyncStatusType.QUEUED,
            created_at: syncRunCreatedAt.toISOString(),
            updated_at: syncRunCreatedAt.toISOString(),
            started_at: null,
            finished_at: null,
            resume_after_at: null,
            records_read: 0,
            records_created: 0,
            records_updated: 0,
            records_deactivated: 0,
            error_message: null,
          },
        ])
      })
  })

  it('/api/admin/sync/runs/:uuid (GET) returns sync run detail', async () => {
    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer()).post('/api/admin/sync/stops').expect(200)

    // Nest's HTTP adapter exposes the raw server as `any`.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .get(`/api/admin/sync/runs/${syncRunUuid}`)
      .expect(200)
      .expect(({ body }: { body: SyncRunDetailResponseBody }) => {
        expect(body).toEqual({
          uuid: syncRunUuid,
          resource: SyncResourceType.STOPS,
          status: SyncStatusType.QUEUED,
          created_at: syncRunCreatedAt.toISOString(),
          updated_at: syncRunCreatedAt.toISOString(),
          started_at: null,
          finished_at: null,
          resume_after_at: null,
          records_read: 0,
          records_created: 0,
          records_updated: 0,
          records_deactivated: 0,
          error_message: null,
          cities: [
            {
              city: CityNameType.TAIPEI,
              status: SyncStatusType.SUCCEEDED,
              started_at: '2026-06-16T00:01:00.000Z',
              finished_at: '2026-06-16T00:02:00.000Z',
              updated_at: '2026-06-16T00:02:00.000Z',
              records_read: 10,
              records_created: 7,
              records_updated: 3,
              records_deactivated: 0,
              error_message: null,
            },
          ],
        })
      })
  })
})
