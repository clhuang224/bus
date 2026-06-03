import { Injectable } from '@nestjs/common'
import {
  CreateFavoriteRouteStopRequestDto,
  FavoriteRouteStopDto,
  FavoriteRouteStopsResponseDto,
} from './dto/favorite-route-stops-response.dto.js'

@Injectable()
export class FavoriteService {
  listRouteStops(): FavoriteRouteStopsResponseDto {
    return { route_stops: [] }
  }

  createRouteStop(
    body: CreateFavoriteRouteStopRequestDto,
  ): FavoriteRouteStopDto {
    return body
  }

  deleteRouteStop(uuid: string): void {
    void uuid
  }
}
