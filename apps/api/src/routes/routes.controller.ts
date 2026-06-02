import { Controller, Get, Param } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  RouteDetailResponseDto,
  RoutesResponseDto,
} from './dto/routes-response.dto.js'
import { RoutesService } from './routes.service.js'

@ApiTags('routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @ApiOperation({ summary: 'List routes' })
  @ApiOkResponse({ type: RoutesResponseDto })
  @Get()
  listRoutes(): RoutesResponseDto {
    return this.routesService.listRoutes()
  }

  @ApiOperation({ summary: 'Get route detail' })
  @ApiOkResponse({ type: RouteDetailResponseDto })
  @Get(':uuid')
  getRoute(@Param('uuid') uuid: string): RouteDetailResponseDto {
    return this.routesService.getRoute(uuid)
  }
}
