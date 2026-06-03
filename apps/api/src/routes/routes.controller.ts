import { AreaType } from '@bus/shared'
import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
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
  @ApiOkResponse({ type: RoutesResponseDto })
  @Get()
  listRoutes(@Query('area') area: AreaType): RoutesResponseDto {
    return this.routesService.listRoutes(area)
  }

  @ApiOperation({ summary: 'Get route detail' })
  @ApiOkResponse({ type: RouteDetailResponseDto })
  @Get(':uuid')
  getRoute(@Param('uuid') uuid: string): RouteDetailResponseDto {
    return this.routesService.getRoute(uuid)
  }
}
