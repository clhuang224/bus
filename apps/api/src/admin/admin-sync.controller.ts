import { Controller, HttpCode, Post } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AdminService } from './admin.service.js'
import { SyncResponseDto } from './dto/sync-response.dto.js'

@ApiTags('admin')
@Controller('admin/sync')
export class AdminSyncController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({
    summary: 'Queue route base-data sync',
    description:
      'Queues a background sync for route, subroute, operator, and route-operator base data.',
  })
  @ApiOkResponse({
    description: 'Queued route sync run.',
    type: SyncResponseDto,
  })
  @HttpCode(200)
  @Post('routes')
  syncRoutes(): Promise<SyncResponseDto> {
    return this.adminService.syncRoutes()
  }

  @ApiOperation({
    summary: 'Queue stop base-data sync',
    description:
      'Contract stub for syncing station group, station, stop, route-stop, and fallback route shape base data. This endpoint does not import TDX data yet.',
  })
  @ApiOkResponse({
    description: 'Queued stop sync run.',
    type: SyncResponseDto,
  })
  @HttpCode(200)
  @Post('stops')
  syncStops(): Promise<SyncResponseDto> {
    return this.adminService.syncStops()
  }
}
