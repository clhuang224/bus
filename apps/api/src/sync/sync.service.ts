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

@Injectable()
export class SyncService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(SyncService.name)
  private readonly activeSyncRunIds = new Set<string>()
  private pollTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly prismaService: PrismaService,
    private readonly routesSyncService: RoutesSyncService,
  ) {}

  onApplicationBootstrap(): void {
    void this.resumeReadyRuns()

    this.pollTimer = setInterval(() => {
      void this.resumeReadyRuns()
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
      select: { id: true },
    })

    await Promise.all(readyRuns.map(({ id }) => this.dispatch(id)))
  }

  private async dispatch(syncRunId: string): Promise<void> {
    if (this.activeSyncRunIds.has(syncRunId)) return

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
