import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiSuccessResponse } from '../dto/api-response.decorator.js'
import {
  CreateFavoriteRouteStopRequestDto,
  FavoriteRouteStopDto,
  FavoriteRouteStopsResponseDto,
} from './dto/favorite-route-stops-response.dto.js'
import { FavoriteService } from './favorite.service.js'

@ApiTags('favorite')
@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @ApiOperation({
    summary: 'List favorite route stops',
    description:
      'WARNING: Backlog placeholder. This endpoint should wait until account/auth work starts because favorites are user-specific and currently remain frontend-local.',
  })
  @ApiSuccessResponse({ type: FavoriteRouteStopsResponseDto })
  @Get('route-stops')
  listRouteStops(): FavoriteRouteStopsResponseDto {
    return this.favoriteService.listRouteStops()
  }

  @ApiOperation({
    summary: 'Create favorite route stop',
    description:
      'WARNING: Backlog placeholder. This endpoint should wait until account/auth work starts because favorites are user-specific and currently remain frontend-local.',
  })
  @ApiSuccessResponse({ status: 201, type: FavoriteRouteStopDto })
  @Post('route-stops')
  createRouteStop(
    @Body() body: CreateFavoriteRouteStopRequestDto,
  ): FavoriteRouteStopDto {
    return this.favoriteService.createRouteStop(body)
  }

  @ApiOperation({
    summary: 'Delete favorite route stop',
    description:
      'WARNING: Backlog placeholder. This endpoint should wait until account/auth work starts because favorites are user-specific and currently remain frontend-local.',
  })
  @ApiNoContentResponse({ description: 'Favorite route stop deleted' })
  @Delete('route-stops/:uuid')
  @HttpCode(204)
  deleteRouteStop(@Param('uuid') uuid: string): void {
    this.favoriteService.deleteRouteStop(uuid)
  }
}
