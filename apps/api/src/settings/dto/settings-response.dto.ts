import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AppLocaleType } from '@bus/shared'

export class SettingsResponseDto {
  @ApiProperty({
    description: 'Preferred app locale',
    enum: AppLocaleType,
    example: AppLocaleType.ZH_TW,
  })
  locale!: AppLocaleType

  @ApiProperty({
    description: 'Whether the user agrees to share anonymous usage data',
    example: true,
  })
  share_usage_data!: boolean
}

export class UpdateSettingsRequestDto {
  @ApiPropertyOptional({
    description: 'Preferred app locale',
    enum: AppLocaleType,
    example: AppLocaleType.EN,
  })
  locale?: AppLocaleType

  @ApiPropertyOptional({
    description: 'Whether the user agrees to share anonymous usage data',
    example: false,
  })
  share_usage_data?: boolean
}
