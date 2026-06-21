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
import { PrismaService } from '../prisma/prisma.service.js'
import { RoutesSyncService } from './routes-sync.service.js'

const READY_SYNC_POLL_INTERVAL_MS = 60_000
const STALE_RUNNING_THRESHOLD_MS = 15 * 60_000

@Injectable()
export class SyncService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name)
  private readonly activeSyncRunIds = new Set<string>()
  // TODO(sync): Guard the resume poll itself so a slow database poll cannot
  // overlap the next interval and duplicate recovery and ready-run queries.
  private pollTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly prismaService: PrismaService,
    private readonly routesSyncService: RoutesSyncService,
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
    const now = new Date()
    await this.recoverStaleRuns(now)

    const readyRuns = await this.prismaService.syncRun.findMany({
      where: {
        resource: PrismaSyncResourceType.ROUTES,
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

    await this.prismaService.syncRun.updateMany({
      where: {
        resource: PrismaSyncResourceType.ROUTES,
        status: PrismaSyncStatusType.RUNNING,
        ...(activeSyncRunIds.length > 0
          ? { id: { notIn: activeSyncRunIds } }
          : {}),
        updated_at: {
          lt: new Date(now.getTime() - STALE_RUNNING_THRESHOLD_MS),
        },
      },
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
      const claimedRun = await this.prismaService.syncRun.updateMany({
        where: {
          id: syncRunId,
          resource: PrismaSyncResourceType.ROUTES,
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

      await this.routesSyncService.syncAllRoutes(syncRunId)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Route sync ${syncRunId} stopped: ${message}`)
    } finally {
      this.activeSyncRunIds.delete(syncRunId)
    }
  }
}
