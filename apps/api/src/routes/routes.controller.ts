import { AreaType, ErrorCode } from '@bus/shared'
import { Controller, Get, Param, ParseEnumPipe, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from '../dto/api-response.decorator.js'
import {
  RouteDetailResponseDto,
  RoutesResponseDto,
} from './dto/routes-response.dto.js'
import { RoutesService } from './routes.service.js'

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @ApiOperation({
    summary: 'List routes for search',
    description:
      'Returns base route data for the selected area. The backend maps the area to one or more cities; realtime data is intentionally excluded from this search index.',
  })
  @ApiQuery({
    name: 'area',
    enum: AreaType,
    required: true,
    description:
      'Search area selected by the client. The backend owns the area-to-city mapping.',
  })
  @ApiSuccessResponse({ type: RoutesResponseDto })
  @Get()
  listRoutes(
    @Query('area', new ParseEnumPipe(AreaType)) area: AreaType,
  ): Promise<RoutesResponseDto> {
    return this.routesService.listRoutes(area)
  }

  @ApiOperation({
    summary: 'Get route detail',
    description:
      'Returns base route detail for one route. Each sub-route shape prefers the more precise route shape from TDX when available and decodable. Shape paths are returned as [longitude, latitude] tuples to reduce payload size. If the precise shape is missing or invalid, the backend falls back to ordered stop positions, so a route with stops should not return an empty shape path.',
  })
  @ApiSuccessResponse({ type: RouteDetailResponseDto })
  @ApiErrorResponse({
    status: 404,
    code: ErrorCode.ROUTE_NOT_FOUND,
    description: 'Route UUID was not found or is inactive.',
  })
  @Get(':uuid')
  getRoute(@Param('uuid') uuid: string): Promise<RouteDetailResponseDto> {
    return this.routesService.getRoute(uuid)
  }
}
