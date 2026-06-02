import { ApiProperty } from '@nestjs/swagger'
import { BearingType, CityNameType } from '@bus/shared'
import { LocalizedTextDto, PositionDto } from '../../dto/shared.dto.js'

export class NearbyStopDto {
  @ApiProperty({ description: 'Stop UUID', example: 'stop-1' })
  uuid!: string

  @ApiProperty({
    description: 'City where the stop is located',
    enum: CityNameType,
    nullable: true,
  })
  city!: CityNameType | null

  @ApiProperty({
    description: 'Bearing direction of the nearby stop',
    enum: BearingType,
    nullable: true,
  })
  bearing!: BearingType | null

  @ApiProperty({
    description: 'Stop address',
    example: '民權東路二段上近建國北路二段同向(向東)',
    nullable: true,
  })
  address!: string | null

  @ApiProperty({ description: 'Localized stop name', type: LocalizedTextDto })
  name!: LocalizedTextDto

  @ApiProperty({ description: 'Geographic position', type: PositionDto })
  position!: PositionDto

  @ApiProperty({
    description: 'Distance from query coordinates in meters',
    example: 120,
    nullable: true,
  })
  distance_meters!: number | null

  @ApiProperty({
    description: 'Last base-data update timestamp',
    example: '2026-06-02T17:25:33+08:00',
  })
  updated_at!: string
}

export class NearbyStopsResponseDto {
  @ApiProperty({
    description: 'Nearby stops from the app database',
    type: [NearbyStopDto],
  })
  stops!: NearbyStopDto[]
}
