import { Injectable } from '@nestjs/common'
import { RouteRealtimeResponseDto } from './dto/route-realtime-response.dto.js'

@Injectable()
export class RealtimeService {
  getRouteRealtime(routeUuid: string): RouteRealtimeResponseDto {
    return {
      uuid: routeUuid,
      arrivals: [],
      vehicles: [],
      updated_at: '',
    }
  }
}
