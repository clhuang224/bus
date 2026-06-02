import { ApiProperty } from '@nestjs/swagger'

export class SettingsResponseDto {
  @ApiProperty({
    description: 'Whether account-backed settings sync is enabled',
    example: false,
  })
  sync_enabled!: boolean
}
