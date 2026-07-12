import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger'
import { ErrorCode } from '@bus/shared'
import { AdminApiKeyGuard } from './admin-api-key.guard.js'
import { AdminService } from './admin.service.js'
import {
  ApiDefaultErrorResponses,
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../dto/api-response.decorator.js'
import {
  SyncRunDetailResponseDto,
  SyncRunSummaryResponseDto,
} from './dto/sync-run-response.dto.js'
import { SyncResponseDto } from './dto/sync-response.dto.js'

@ApiTags('admin')
@ApiSecurity('adminApiKey')
@ApiDefaultErrorResponses()
@ApiErrorResponse({
  status: 401,
  code: ErrorCode.SYSTEM_UNAUTHORIZED,
  description: 'A valid admin API key is required.',
})
@UseGuards(AdminApiKeyGuard)
@Controller('admin/sync')
export class AdminSyncController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({
    summary: 'List recent sync runs',
    description:
      'Returns recent route and stop sync runs for local admin monitoring.',
  })
  @ApiSuccessResponse({
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
  @ApiSuccessResponse({
    description: 'Sync run detail.',
    type: SyncRunDetailResponseDto,
  })
  @ApiErrorResponse({
    status: 404,
    code: ErrorCode.SYSTEM_NOT_FOUND,
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
  @ApiSuccessResponse({
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
  @ApiSuccessResponse({
    description: 'Queued stop sync run.',
    type: SyncResponseDto,
  })
  @HttpCode(200)
  @Post('stops')
  syncStops(): Promise<SyncResponseDto> {
    return this.adminService.syncStops()
  }
}
