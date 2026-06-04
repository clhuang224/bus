import { Injectable } from '@nestjs/common'
import { AppLocaleType, getEnumValues } from '@bus/shared'
import {
  SettingsResponseDto,
  UpdateSettingsRequestDto,
} from './dto/settings-response.dto.js'

function isAppLocale(value: unknown): value is AppLocaleType {
  return getEnumValues(AppLocaleType).includes(value as AppLocaleType)
}

@Injectable()
export class SettingsService {
  private readonly defaultSettings: SettingsResponseDto = {
    locale: AppLocaleType.ZH_TW,
    share_usage_data: true,
  }

  getSettings(): SettingsResponseDto {
    return this.defaultSettings
  }

  updateSettings(body: UpdateSettingsRequestDto): SettingsResponseDto {
    const locale = isAppLocale(body.locale)
      ? body.locale
      : this.defaultSettings.locale

    return {
      locale,
      share_usage_data:
        typeof body.share_usage_data === 'boolean'
          ? body.share_usage_data
          : this.defaultSettings.share_usage_data,
    }
  }
}
