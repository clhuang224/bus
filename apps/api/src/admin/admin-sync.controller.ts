import { Controller, Post } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminService } from './admin.service.js'
import { SyncResponseDto } from './dto/sync-response.dto.js'

@ApiTags('admin')
@Controller('admin/sync')
export class AdminSyncController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'Sync route base data' })
  @ApiOkResponse({ type: SyncResponseDto })
  @Post('routes')
  syncRoutes(): SyncResponseDto {
    return this.adminService.syncRoutes()
  }

  @ApiOperation({ summary: 'Sync stop base data' })
  @ApiOkResponse({ type: SyncResponseDto })
  @Post('stops')
  syncStops(): SyncResponseDto {
    return this.adminService.syncStops()
  }
}
