import { Injectable } from '@nestjs/common'
import { StopDetailResponseDto } from './dto/stops-response.dto.js'

@Injectable()
export class StopsService {
  getStop(uuid: string): StopDetailResponseDto {
    return {
      uuid,
      city: null,
      name: { zh_tw: '', en: '' },
      address: null,
      bearing: null,
      position: null,
      routes: [],
      updated_at: '',
    }
  }
}
