import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common'
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { AdminService } from './admin.service.js'
import {
  SyncRunDetailResponseDto,
  SyncRunSummaryResponseDto,
} from './dto/sync-run-response.dto.js'
import { SyncResponseDto } from './dto/sync-response.dto.js'

@ApiTags('admin')
@Controller('admin/sync')
export class AdminSyncController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({
    summary: 'List recent sync runs',
    description:
      'Returns recent route and stop sync runs for local admin monitoring.',
  })
  @ApiOkResponse({
    description: 'Recent sync runs.',
    type: [SyncRunSummaryResponseDto],
  })
  @Get('runs')
  listSyncRuns(): Promise<SyncRunSummaryResponseDto[]> {
    return this.adminService.listSyncRuns()
  }

  @ApiOperation({
    summary: 'Get sync run detail',
    description:
      'Returns one sync run with per-city checkpoints for local admin monitoring.',
  })
  @ApiOkResponse({
    description: 'Sync run detail.',
    type: SyncRunDetailResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Sync run was not found.',
  })
  @Get('runs/:uuid')
  getSyncRun(@Param('uuid') uuid: string): Promise<SyncRunDetailResponseDto> {
    return this.adminService.getSyncRun(uuid)
  }

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
      'Queues a background sync for station group, station, stop, route-stop, and fallback route shape base data.',
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
