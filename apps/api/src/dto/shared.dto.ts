import { ApiProperty } from '@nestjs/swagger'

export class LocalizedTextDto {
  @ApiProperty({ description: 'Traditional Chinese text', example: '市政府' })
  'zh-TW'!: string

  @ApiProperty({ description: 'English text', example: 'City Hall' })
  en!: string
}

export class PositionDto {
  @ApiProperty({ description: 'Latitude', example: 25.033 })
  latitude!: number

  @ApiProperty({ description: 'Longitude', example: 121.5654 })
  longitude!: number
}
