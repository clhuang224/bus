import { Injectable } from '@nestjs/common'
import { AreaType } from '@bus/shared'
import {
  RouteDetailResponseDto,
  RoutesResponseDto,
} from './dto/routes-response.dto.js'

@Injectable()
export class RoutesService {
  listRoutes(area: AreaType): RoutesResponseDto {
    void area

    return { routes: [] }
  }

  getRoute(uuid: string): RouteDetailResponseDto {
    return {
      uuid,
      city: null,
      name: { zh_tw: '', en: '' },
      departure: { zh_tw: '', en: '' },
      destination: { zh_tw: '', en: '' },
      sub_routes: [],
    }
  }
}
