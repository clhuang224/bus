import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FavoriteRouteStopsResponseDto } from './dto/favorite-route-stops-response.dto.js'
import { FavoriteService } from './favorite.service.js'

@ApiTags('favorite')
@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @ApiOperation({ summary: 'List favorite route stops' })
  @ApiOkResponse({ type: FavoriteRouteStopsResponseDto })
  @Get('route-stops')
  listRouteStops(): FavoriteRouteStopsResponseDto {
    return this.favoriteService.listRouteStops()
  }
}
