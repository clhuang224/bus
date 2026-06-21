import { Injectable } from '@nestjs/common'
import { SyncResourceType, SyncStatusType } from '@bus/shared'
import {
  SyncResourceType as PrismaSyncResourceType,
  SyncStatusType as PrismaSyncStatusType,
} from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { SyncService } from '../sync/sync.service.js'
import { SyncResponseDto } from './dto/sync-response.dto.js'

const ACTIVE_SYNC_STATUSES: PrismaSyncStatusType[] = [
  PrismaSyncStatusType.QUEUED,
  PrismaSyncStatusType.RUNNING,
  PrismaSyncStatusType.PENDING,
]

const SYNC_RESOURCE_LOCK_IDS: Record<PrismaSyncResourceType, number> = {
  [PrismaSyncResourceType.ROUTES]: 7_324_701,
  [PrismaSyncResourceType.STOPS]: 7_324_702,
  [PrismaSyncResourceType.STATIONS]: 7_324_703,
  [PrismaSyncResourceType.SHAPES]: 7_324_704,
}

interface SyncRunRecord {
  id: string
  status: PrismaSyncStatusType
  started_at: Date | null
  finished_at: Date | null
  records_read: number
  records_created: number
  records_updated: number
  records_deactivated: number
  error_message: string | null
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly syncService: SyncService,
  ) {}

  async syncRoutes(): Promise<SyncResponseDto> {
    const response = await this.createSyncRun({
      apiResource: SyncResourceType.ROUTES,
      prismaResource: PrismaSyncResourceType.ROUTES,
    })

    if (response.uuid) {
      this.syncService.enqueue(response.uuid)
    }

    return response
  }

  async syncStops(): Promise<SyncResponseDto> {
    return this.createSyncRun({
      apiResource: SyncResourceType.STOPS,
      prismaResource: PrismaSyncResourceType.STOPS,
    })
  }

  private async createSyncRun({
    apiResource,
    prismaResource,
  }: {
    apiResource: SyncResourceType
    prismaResource: PrismaSyncResourceType
  }): Promise<SyncResponseDto> {
    const syncRun = await this.prismaService.$transaction(
      async (transaction) => {
        await transaction.$executeRawUnsafe(
          `SELECT pg_advisory_xact_lock(${SYNC_RESOURCE_LOCK_IDS[prismaResource]})`,
        )

        const latestSyncRun = await transaction.syncRun.findFirst({
          where: {
            resource: prismaResource,
          },
          orderBy: { created_at: 'desc' },
        })

        if (
          latestSyncRun &&
          ACTIVE_SYNC_STATUSES.includes(latestSyncRun.status)
        ) {
          return latestSyncRun
        }

        if (latestSyncRun?.status === PrismaSyncStatusType.FAILED) {
          return transaction.syncRun.update({
            where: { id: latestSyncRun.id },
            data: {
              status: PrismaSyncStatusType.QUEUED,
              started_at: null,
              finished_at: null,
              resume_after_at: null,
              error_message: null,
            },
          })
        }

        return transaction.syncRun.create({
          data: {
            resource: prismaResource,
            status: PrismaSyncStatusType.QUEUED,
          },
        })
      },
    )

    return this.toSyncResponse(syncRun, apiResource)
  }

  private toSyncResponse(
    syncRun: SyncRunRecord,
    resource: SyncResourceType,
  ): SyncResponseDto {
    return {
      uuid: syncRun.id,
      resource,
      status: this.toApiStatus(syncRun.status),
      started_at: syncRun.started_at?.toISOString() ?? null,
      finished_at: syncRun.finished_at?.toISOString() ?? null,
      records_read: syncRun.records_read,
      records_created: syncRun.records_created,
      records_updated: syncRun.records_updated,
      records_deactivated: syncRun.records_deactivated,
      error_message: syncRun.error_message,
    }
  }

  private toApiStatus(status: PrismaSyncStatusType): SyncStatusType {
    switch (status) {
      case PrismaSyncStatusType.QUEUED:
        return SyncStatusType.QUEUED
      case PrismaSyncStatusType.RUNNING:
        return SyncStatusType.RUNNING
      case PrismaSyncStatusType.PENDING:
        return SyncStatusType.PENDING
      case PrismaSyncStatusType.SUCCEEDED:
        return SyncStatusType.SUCCEEDED
      case PrismaSyncStatusType.FAILED:
        return SyncStatusType.FAILED
    }
  }
}
