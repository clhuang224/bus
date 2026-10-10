import { ErrorCode } from '@bus/shared'
import { Controller, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../dto/api-response.decorator.js'
import { RouteRealtimeResponseDto } from './dto/route-realtime-response.dto.js'
import { RealtimeService } from './realtime.service.js'

@ApiTags('realtime')
@Controller('realtime/routes')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @ApiOperation({
    summary: 'Get route realtime polling snapshot',
    description:
      'Returns what each sub-route should show: an arrival per stop, the vehicles with their arrivals, and a status message. Data comes from TDX and is cached per route for up to 15 seconds, or 5 seconds when a TDX feed failed. Feed failures are reported through each sub-route status instead of an error response.',
  })
  @ApiSuccessResponse({ type: RouteRealtimeResponseDto })
  @ApiErrorResponse({
    status: 404,
    code: ErrorCode.ROUTE_NOT_FOUND,
    description: 'Route UUID was not found or is inactive.',
  })
  @Get(':uuid')
  getRouteRealtime(
    @Param('uuid') uuid: string,
  ): Promise<RouteRealtimeResponseDto> {
    return this.realtimeService.getRouteRealtime(uuid)
  }
}
