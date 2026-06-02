import { Injectable } from '@nestjs/common'
import { FavoriteRouteStopsResponseDto } from './dto/favorite-route-stops-response.dto.js'

@Injectable()
export class FavoriteService {
  listRouteStops(): FavoriteRouteStopsResponseDto {
    return { route_stops: [] }
  }
}
