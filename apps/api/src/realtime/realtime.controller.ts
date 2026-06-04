import { Controller, Get, Param } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RouteRealtimeResponseDto } from './dto/route-realtime-response.dto.js'
import { RealtimeService } from './realtime.service.js'

@ApiTags('realtime')
@Controller('realtime/routes')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @ApiOperation({ summary: 'Get route realtime polling snapshot' })
  @ApiOkResponse({ type: RouteRealtimeResponseDto })
  @Get(':uuid')
  getRouteRealtime(@Param('uuid') uuid: string): RouteRealtimeResponseDto {
    return this.realtimeService.getRouteRealtime(uuid)
  }
}
