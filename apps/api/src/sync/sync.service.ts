import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common'
import {
  SyncResourceType as PrismaSyncResourceType,
  SyncStatusType as PrismaSyncStatusType,
} from '../generated/prisma/enums.js'
import type { Prisma } from '../generated/prisma/client.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { RoutesSyncService } from './routes-sync.service.js'
import { StopsSyncService } from './stops-sync.service.js'

const READY_SYNC_POLL_INTERVAL_MS = 60_000
const STALE_RUNNING_THRESHOLD_MS = 15 * 60_000
const DISPATCHABLE_SYNC_RESOURCES = [
  PrismaSyncResourceType.ROUTES,
  PrismaSyncResourceType.STOPS,
] as const

@Injectable()
export class SyncService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name)
  private readonly activeSyncRunIds = new Set<string>()
  private readyRunsPromise: Promise<void> | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly prismaService: PrismaService,
    private readonly routesSyncService: RoutesSyncService,
    private readonly stopsSyncService: StopsSyncService,
  ) {}

  onApplicationBootstrap(): void {
    this.pollReadyRuns()

    this.pollTimer = setInterval(() => {
      this.pollReadyRuns()
    }, READY_SYNC_POLL_INTERVAL_MS)
    this.pollTimer.unref()
  }

  onModuleDestroy(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  }

  enqueue(syncRunId: string): void {
    void this.dispatch(syncRunId)
  }

  async resumeReadyRuns(): Promise<void> {
    if (this.readyRunsPromise) return this.readyRunsPromise

    this.readyRunsPromise = this.resumeReadyRunsOnce()

    try {
      await this.readyRunsPromise
    } finally {
      this.readyRunsPromise = null
    }
  }

  private async resumeReadyRunsOnce(): Promise<void> {
    const now = new Date()
    await this.recoverStaleRuns(now)

    const readyRuns = await this.prismaService.syncRun.findMany({
      where: {
        resource: { in: [...DISPATCHABLE_SYNC_RESOURCES] },
        OR: [
          { status: PrismaSyncStatusType.QUEUED },
          {
            status: PrismaSyncStatusType.PENDING,
            resume_after_at: { lte: now },
          },
        ],
      },
      orderBy: { created_at: 'asc' },
      select: { id: true },
    })

    await Promise.all(readyRuns.map(({ id }) => this.dispatch(id)))
  }

  private pollReadyRuns(): void {
    void this.resumeReadyRuns().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Sync resume poll failed: ${message}`)
    })
  }

  private async recoverStaleRuns(now: Date): Promise<void> {
    const activeSyncRunIds = [...this.activeSyncRunIds]
    const staleRunWhere = {
      resource: { in: [...DISPATCHABLE_SYNC_RESOURCES] },
      status: PrismaSyncStatusType.RUNNING,
      ...(activeSyncRunIds.length > 0
        ? { id: { notIn: activeSyncRunIds } }
        : {}),
      updated_at: {
        lt: new Date(now.getTime() - STALE_RUNNING_THRESHOLD_MS),
      },
    } satisfies Prisma.SyncRunWhereInput

    await this.prismaService.syncRunCity.updateMany({
      where: {
        status: PrismaSyncStatusType.RUNNING,
        sync_run: staleRunWhere,
      },
      data: {
        status: PrismaSyncStatusType.QUEUED,
        started_at: null,
        finished_at: null,
        records_read: 0,
        records_created: 0,
        records_updated: 0,
        records_deactivated: 0,
        error_message: 'Recovered after the previous sync worker stopped.',
      },
    })

    await this.prismaService.syncRun.updateMany({
      where: staleRunWhere,
      data: {
        status: PrismaSyncStatusType.QUEUED,
        started_at: null,
        finished_at: null,
        resume_after_at: null,
        records_read: 0,
        records_created: 0,
        records_updated: 0,
        records_deactivated: 0,
        error_message: 'Recovered after the previous sync worker stopped.',
      },
    })
  }

  private async dispatch(syncRunId: string): Promise<void> {
    if (
      this.activeSyncRunIds.has(syncRunId) ||
      this.activeSyncRunIds.size > 0
    ) {
      return
    }

    this.activeSyncRunIds.add(syncRunId)

    try {
      const syncRun = await this.prismaService.syncRun.findUnique({
        where: { id: syncRunId },
        select: { resource: true },
      })

      if (
        !syncRun ||
        !DISPATCHABLE_SYNC_RESOURCES.includes(
          syncRun.resource as (typeof DISPATCHABLE_SYNC_RESOURCES)[number],
        )
      ) {
        return
      }

      const claimedRun = await this.prismaService.syncRun.updateMany({
        where: {
          id: syncRunId,
          resource: syncRun.resource,
          OR: [
            { status: PrismaSyncStatusType.QUEUED },
            {
              status: PrismaSyncStatusType.PENDING,
              resume_after_at: { lte: new Date() },
            },
          ],
        },
        data: {
          status: PrismaSyncStatusType.RUNNING,
          resume_after_at: null,
        },
      })

      if (claimedRun.count === 0) return

      if (syncRun.resource === PrismaSyncResourceType.ROUTES) {
        await this.routesSyncService.syncAllRoutes(syncRunId)
        return
      }

      await this.stopsSyncService.syncAllStops(syncRunId)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Sync ${syncRunId} stopped: ${message}`)
    } finally {
      this.activeSyncRunIds.delete(syncRunId)
    }
  }
}
