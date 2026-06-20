import { Injectable } from '@nestjs/common'
import { SyncResourceType, SyncStatusType } from '@bus/shared'
import {
  SyncResourceType as PrismaSyncResourceType,
  SyncStatusType as PrismaSyncStatusType,
} from '../generated/prisma/enums.js'
import { PrismaService } from '../prisma/prisma.service.js'
import { SyncService } from '../sync/sync.service.js'
import { SyncResponseDto } from './dto/sync-response.dto.js'

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
    const syncRun = await this.prismaService.syncRun.create({
      data: {
        resource: prismaResource,
        status: PrismaSyncStatusType.QUEUED,
      },
    })

    return {
      uuid: syncRun.id,
      resource: apiResource,
      status: SyncStatusType.QUEUED,
      started_at: syncRun.started_at?.toISOString() ?? null,
      finished_at: syncRun.finished_at?.toISOString() ?? null,
      records_read: syncRun.records_read,
      records_created: syncRun.records_created,
      records_updated: syncRun.records_updated,
      records_deactivated: syncRun.records_deactivated,
      error_message: syncRun.error_message,
    }
  }
}
