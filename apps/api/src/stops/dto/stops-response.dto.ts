import { ApiProperty } from '@nestjs/swagger'
import { BearingType, CityNameType, DirectionType } from '@bus/shared'
import { LocalizedTextDto, PositionDto } from '../../dto/shared.dto.js'

export class StopRouteDto {
  @ApiProperty({ description: 'Route UUID', example: 'route-1' })
  uuid!: string

  @ApiProperty({ description: 'Localized route name', type: LocalizedTextDto })
  name!: LocalizedTextDto

  @ApiProperty({ description: 'Route direction', enum: DirectionType })
  direction!: DirectionType
}

export class StopDetailResponseDto {
  @ApiProperty({ description: 'Stop UUID', example: 'stop-1' })
  uuid!: string

  @ApiProperty({
    description: 'City where the stop is located',
    enum: CityNameType,
    nullable: true,
  })
  city!: CityNameType | null

  @ApiProperty({ description: 'Localized stop name', type: LocalizedTextDto })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Stop address',
    example: '市府路 1 號',
    nullable: true,
  })
  address!: string | null

  @ApiProperty({
    description: 'Stop bearing',
    enum: BearingType,
    nullable: true,
  })
  bearing!: BearingType | null

  @ApiProperty({
    description: 'Stop position',
    type: PositionDto,
    nullable: true,
  })
  position!: PositionDto | null

  @ApiProperty({
    description: 'Routes serving this stop',
    type: [StopRouteDto],
  })
  routes!: StopRouteDto[]

  @ApiProperty({
    description: 'Last base-data update timestamp',
    example: '2026-06-02T17:25:33+08:00',
  })
  updated_at!: string
}
