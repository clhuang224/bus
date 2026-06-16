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
      'Contract stub for syncing route, subroute, operator, route-operator, and route shape base data. This endpoint does not import TDX data yet.',
  })
  @ApiOkResponse({
    description: 'Route sync run placeholder.',
    type: SyncResponseDto,
  })
  @HttpCode(200)
  @Post('routes')
  syncRoutes(): SyncResponseDto {
    return this.adminService.syncRoutes()
  }

  @ApiOperation({
    summary: 'Queue stop base-data sync',
    description:
      'Contract stub for syncing station group, station, stop, route-stop, and fallback route shape base data. This endpoint does not import TDX data yet.',
  })
  @ApiOkResponse({
    description: 'Stop sync run placeholder.',
    type: SyncResponseDto,
  })
  @HttpCode(200)
  @Post('stops')
  syncStops(): SyncResponseDto {
    return this.adminService.syncStops()
  }
}
