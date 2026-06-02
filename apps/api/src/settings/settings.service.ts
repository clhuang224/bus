import { Injectable } from '@nestjs/common'
import { SettingsResponseDto } from './dto/settings-response.dto.js'

@Injectable()
export class SettingsService {
  getSettings(): SettingsResponseDto {
    return { sync_enabled: false }
  }
}
