import { Injectable } from '@nestjs/common'
import { AppLocaleType } from '@bus/shared'
import {
  SettingsResponseDto,
  UpdateSettingsRequestDto,
} from './dto/settings-response.dto.js'

@Injectable()
export class SettingsService {
  getSettings(): SettingsResponseDto {
    return {
      locale: AppLocaleType.ZH_TW,
      share_usage_data: true,
    }
  }

  updateSettings(body: UpdateSettingsRequestDto): SettingsResponseDto {
    return {
      locale: body.locale ?? AppLocaleType.ZH_TW,
      share_usage_data: body.share_usage_data ?? true,
    }
  }
}
