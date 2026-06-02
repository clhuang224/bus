import { Injectable } from '@nestjs/common'
import {
  RouteDetailResponseDto,
  RoutesResponseDto,
} from './dto/routes-response.dto.js'

@Injectable()
export class RoutesService {
  listRoutes(): RoutesResponseDto {
    return { routes: [] }
  }

  getRoute(uuid: string): RouteDetailResponseDto {
    return {
      uuid,
      city: null,
      name: { zh_tw: '', en: '' },
      departure: { zh_tw: '', en: '' },
      destination: { zh_tw: '', en: '' },
      updated_at: '',
      sub_routes: [],
      stops: [],
    }
  }
}
