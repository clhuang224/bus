import { Injectable } from '@nestjs/common'
import { StationsResponseDto } from './dto/stations-response.dto.js'

interface ListStationsOptions {
  latitude: number
  longitude: number
  radius_meters?: number
}

@Injectable()
export class StationsService {
  listStations(options: ListStationsOptions): StationsResponseDto {
    void options

    return { stations: [] }
  }
}
