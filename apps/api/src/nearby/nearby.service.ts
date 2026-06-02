import { Injectable } from '@nestjs/common'
import { NearbyStopsResponseDto } from './dto/nearby-stops-response.dto.js'

@Injectable()
export class NearbyService {
  listNearbyStops(): NearbyStopsResponseDto {
    return { stops: [] }
  }
}
