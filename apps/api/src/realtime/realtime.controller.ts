import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiSuccessResponse } from '../dto/api-response.decorator.js'
import { RouteRealtimeResponseDto } from './dto/route-realtime-response.dto.js'
import { RealtimeService } from './realtime.service.js'

@ApiTags('realtime')
@Controller('realtime/routes')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @ApiOperation({ summary: 'Get route realtime polling snapshot' })
  @ApiSuccessResponse({ type: RouteRealtimeResponseDto })
  @Get(':uuid')
  getRouteRealtime(@Param('uuid') uuid: string): RouteRealtimeResponseDto {
    return this.realtimeService.getRouteRealtime(uuid)
  }
}
