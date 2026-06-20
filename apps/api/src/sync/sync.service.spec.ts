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
  select: { id: boolean }
}

interface ClaimQuery extends ReadyRunQuery {
  where: ReadyRunQuery['where'] & { id: string }
  data: {
    status: PrismaSyncStatusType
    resume_after_at: null
  }
}

function createService({
  readyRunIds,
  claimCount = 1,
}: {
  readyRunIds: string[]
  claimCount?: number
}) {
  const readyRunQueryCalls: unknown[] = []
  const claimCalls: unknown[] = []
  const syncedRunIds: string[] = []
  const prismaService = {
    syncRun: {
      findMany: (args: unknown) => {
        readyRunQueryCalls.push(args)
        return Promise.resolve(readyRunIds.map((id) => ({ id })))
      },
      updateMany: (args: unknown) => {
        claimCalls.push(args)
        return Promise.resolve({ count: claimCount })
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

  return { claimCalls, readyRunQueryCalls, service, syncedRunIds }
}

describe('SyncService', () => {
  it('claims and runs ready route syncs', async () => {
    const { claimCalls, readyRunQueryCalls, service, syncedRunIds } =
      createService({
        readyRunIds: ['sync-run-1'],
      })

    await service.resumeReadyRuns()

    expect(readyRunQueryCalls).toHaveLength(1)
    const readyRunQuery = readyRunQueryCalls[0] as ReadyRunQuery
    expect(readyRunQuery.where.resource).toBe(PrismaSyncResourceType.ROUTES)
    expect(readyRunQuery.where.OR[0].status).toBe(PrismaSyncStatusType.QUEUED)
    expect(readyRunQuery.where.OR[1].status).toBe(PrismaSyncStatusType.PENDING)
    expect(readyRunQuery.where.OR[1].resume_after_at.lte).toBeInstanceOf(Date)
    expect(readyRunQuery.select).toEqual({ id: true })

    expect(claimCalls).toHaveLength(1)
    const claim = claimCalls[0] as ClaimQuery
    expect(claim.where.id).toBe('sync-run-1')
    expect(claim.where.resource).toBe(PrismaSyncResourceType.ROUTES)
    expect(claim.where.OR[1].resume_after_at.lte).toBeInstanceOf(Date)
    expect(claim.data).toEqual({
      status: PrismaSyncStatusType.RUNNING,
      resume_after_at: null,
    })
    expect(syncedRunIds).toEqual(['sync-run-1'])
  })

  it('does not dispatch the same run twice in one process', async () => {
    const { service, syncedRunIds } = createService({
      readyRunIds: ['sync-run-1', 'sync-run-1'],
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
})
