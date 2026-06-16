import { Injectable } from '@nestjs/common'
import { SyncResourceType, SyncStatusType } from '@bus/shared'
import { SyncResponseDto } from './dto/sync-response.dto.js'

@Injectable()
export class AdminService {
  syncRoutes(): SyncResponseDto {
    return this.createEmptySyncResponse(SyncResourceType.ROUTES)
  }

  syncStops(): SyncResponseDto {
    return this.createEmptySyncResponse(SyncResourceType.STOPS)
  }

  private createEmptySyncResponse(resource: SyncResourceType): SyncResponseDto {
    return {
      uuid: null,
      resource,
      status: SyncStatusType.QUEUED,
      started_at: null,
      finished_at: null,
      records_read: 0,
      records_created: 0,
      records_updated: 0,
      records_deactivated: 0,
      error_message: null,
    }
  }
}
