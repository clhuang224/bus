import {
  SyncResourceType as PrismaSyncResourceType,
  SyncStatusType as PrismaSyncStatusType,
} from '../generated/prisma/enums.js'
import type { PrismaService } from '../prisma/prisma.service.js'
import type { RoutesSyncService } from './routes-sync.service.js'
import { SyncService } from './sync.service.js'

interface ReadyRunQuery {
  where: {
    resource: PrismaSyncResourceType
    OR: [
      { status: PrismaSyncStatusType },
      {
        status: PrismaSyncStatusType
        resume_after_at: { lte: Date }
      },
    ]
  }
  orderBy: { created_at: 'asc' }
  select: { id: boolean }
}

interface ClaimQuery extends ReadyRunQuery {
  where: ReadyRunQuery['where'] & { id: string }
  data: {
    status: PrismaSyncStatusType
    resume_after_at: null
  }
}

interface StaleRecoveryQuery {
  where: {
    resource: PrismaSyncResourceType
    status: PrismaSyncStatusType
    updated_at: { lt: Date }
  }
  data: {
    status: PrismaSyncStatusType
    started_at: null
    finished_at: null
    resume_after_at: null
    records_read: number
    records_created: number
    records_updated: number
    records_deactivated: number
    error_message: string
  }
}

interface StaleCityRecoveryQuery {
  where: {
    status: PrismaSyncStatusType
    sync_run: StaleRecoveryQuery['where']
  }
  data: Omit<StaleRecoveryQuery['data'], 'resume_after_at'>
}

function createService({
  readyRunIds,
  claimCount = 1,
  recoveryError,
}: {
  readyRunIds: string[]
  claimCount?: number
  recoveryError?: Error
}) {
  const readyRunQueryCalls: unknown[] = []
  const cityUpdateManyCalls: unknown[] = []
  const updateManyCalls: unknown[] = []
  const syncedRunIds: string[] = []
  const prismaService = {
    syncRunCity: {
      updateMany: (args: unknown) => {
        cityUpdateManyCalls.push(args)
        return Promise.resolve({ count: 0 })
      },
    },
    syncRun: {
      findMany: (args: unknown) => {
        readyRunQueryCalls.push(args)
        return Promise.resolve(readyRunIds.map((id) => ({ id })))
      },
      updateMany: (args: unknown) => {
        updateManyCalls.push(args)

        if (updateManyCalls.length === 1 && recoveryError) {
          return Promise.reject(recoveryError)
        }

        return Promise.resolve({
          count: updateManyCalls.length === 1 ? 0 : claimCount,
        })
      },
    },
  }
  const routesSyncService = {
    syncAllRoutes: (syncRunId: string) => {
      syncedRunIds.push(syncRunId)
      return Promise.resolve({
        records_read: 0,
        records_created: 0,
        records_updated: 0,
        records_deactivated: 0,
      })
    },
  }
  const service = new SyncService(
    prismaService as unknown as PrismaService,
    routesSyncService as unknown as RoutesSyncService,
  )

  return {
    cityUpdateManyCalls,
    readyRunQueryCalls,
    service,
    syncedRunIds,
    updateManyCalls,
  }
}

describe('SyncService', () => {
  it('claims and runs ready route syncs', async () => {
    const {
      cityUpdateManyCalls,
      readyRunQueryCalls,
      service,
      syncedRunIds,
      updateManyCalls,
    } = createService({
      readyRunIds: ['sync-run-1'],
    })

    await service.resumeReadyRuns()

    expect(readyRunQueryCalls).toHaveLength(1)
    const readyRunQuery = readyRunQueryCalls[0] as ReadyRunQuery
    expect(readyRunQuery.where.resource).toBe(PrismaSyncResourceType.ROUTES)
    expect(readyRunQuery.where.OR[0].status).toBe(PrismaSyncStatusType.QUEUED)
    expect(readyRunQuery.where.OR[1].status).toBe(PrismaSyncStatusType.PENDING)
    expect(readyRunQuery.where.OR[1].resume_after_at.lte).toBeInstanceOf(Date)
    expect(readyRunQuery.orderBy).toEqual({ created_at: 'asc' })
    expect(readyRunQuery.select).toEqual({ id: true })

    expect(updateManyCalls).toHaveLength(2)
    const recovery = updateManyCalls[0] as StaleRecoveryQuery
    expect(recovery.where.resource).toBe(PrismaSyncResourceType.ROUTES)
    expect(recovery.where.status).toBe(PrismaSyncStatusType.RUNNING)
    expect(recovery.where.updated_at.lt).toBeInstanceOf(Date)
    expect(recovery.data).toEqual({
      status: PrismaSyncStatusType.QUEUED,
      started_at: null,
      finished_at: null,
      resume_after_at: null,
      records_read: 0,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
      error_message: 'Recovered after the previous sync worker stopped.',
    })

    expect(cityUpdateManyCalls).toHaveLength(1)
    const cityRecovery = cityUpdateManyCalls[0] as StaleCityRecoveryQuery
    expect(cityRecovery.where.status).toBe(PrismaSyncStatusType.RUNNING)
    expect(cityRecovery.where.sync_run).toEqual(recovery.where)
    expect(cityRecovery.data).toEqual({
      status: PrismaSyncStatusType.QUEUED,
      started_at: null,
      finished_at: null,
      records_read: 0,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
      error_message: 'Recovered after the previous sync worker stopped.',
    })

    const claim = updateManyCalls[1] as ClaimQuery
    expect(claim.where.id).toBe('sync-run-1')
    expect(claim.where.resource).toBe(PrismaSyncResourceType.ROUTES)
    expect(claim.where.OR[1].resume_after_at.lte).toBeInstanceOf(Date)
    expect(claim.data).toEqual({
      status: PrismaSyncStatusType.RUNNING,
      resume_after_at: null,
    })
    expect(syncedRunIds).toEqual(['sync-run-1'])
  })

  it('does not dispatch route sync runs concurrently in one process', async () => {
    const { service, syncedRunIds } = createService({
      readyRunIds: ['sync-run-1', 'sync-run-2'],
    })

    await service.resumeReadyRuns()

    expect(syncedRunIds).toEqual(['sync-run-1'])
  })

  it('does not run a sync that another instance already claimed', async () => {
    const { service, syncedRunIds } = createService({
      readyRunIds: ['sync-run-1'],
      claimCount: 0,
    })

    await service.resumeReadyRuns()

    expect(syncedRunIds).toEqual([])
  })

  it('logs errors from the background resume poll', async () => {
    const loggedErrors: string[] = []
    const { service } = createService({
      readyRunIds: [],
      recoveryError: new Error('Database unavailable'),
    })
    const serviceWithLogger = service as unknown as {
      logger: { error: (message: string) => void }
    }
    serviceWithLogger.logger = {
      error: (message) => loggedErrors.push(message),
    }

    service.onApplicationBootstrap()
    await new Promise((resolve) => setImmediate(resolve))
    service.onModuleDestroy()

    expect(loggedErrors).toEqual([
      'Sync resume poll failed: Database unavailable',
    ])
  })
})
