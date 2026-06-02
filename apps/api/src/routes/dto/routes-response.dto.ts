import { ApiProperty } from '@nestjs/swagger'
import { CityNameType, DirectionType } from '@bus/shared'
import { LocalizedTextDto, PositionDto } from '../../dto/shared.dto.js'

export class RouteSummaryDto {
  @ApiProperty({ description: 'Route UUID', example: 'route-1' })
  uuid!: string

  @ApiProperty({
    description: 'City where the route operates',
    enum: CityNameType,
    nullable: true,
  })
  city!: CityNameType | null

  @ApiProperty({ description: 'Localized route name', type: LocalizedTextDto })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Localized departure stop name',
    type: LocalizedTextDto,
  })
  departure!: LocalizedTextDto

  @ApiProperty({
    description: 'Localized destination stop name',
    type: LocalizedTextDto,
  })
  destination!: LocalizedTextDto

  @ApiProperty({
    description: 'Last base-data update timestamp',
    example: '2026-06-02T17:25:33+08:00',
  })
  updated_at!: string
}

export class RoutesResponseDto {
  @ApiProperty({
    description: 'Routes from the app database',
    type: [RouteSummaryDto],
  })
  routes!: RouteSummaryDto[]
}

export class RouteSubRouteDto {
  @ApiProperty({ description: 'Sub-route UUID', example: 'subroute-1' })
  uuid!: string

  @ApiProperty({
    description: 'Localized sub-route name',
    type: LocalizedTextDto,
  })
  name!: LocalizedTextDto

  @ApiProperty({ description: 'Route direction', enum: DirectionType })
  direction!: DirectionType

  @ApiProperty({
    description: 'Localized departure stop name',
    type: LocalizedTextDto,
  })
  departure!: LocalizedTextDto

  @ApiProperty({
    description: 'Localized destination stop name',
    type: LocalizedTextDto,
  })
  destination!: LocalizedTextDto

  @ApiProperty({
    description: 'First bus time in HH:mm format',
    example: '06:00',
    nullable: true,
  })
  first_bus_time!: string | null

  @ApiProperty({
    description: 'Last bus time in HH:mm format',
    example: '23:30',
    nullable: true,
  })
  last_bus_time!: string | null
}

export class RouteStopDto {
  @ApiProperty({ description: 'Stop UUID', example: 'stop-1' })
  uuid!: string

  @ApiProperty({
    description: 'Stop sequence in the route direction',
    example: 1,
  })
  sequence!: number

  @ApiProperty({ description: 'Localized stop name', type: LocalizedTextDto })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Stop position',
    type: PositionDto,
    nullable: true,
  })
  position!: PositionDto | null
}

export class RouteDetailResponseDto extends RouteSummaryDto {
  @ApiProperty({
    description: 'Sub-routes for this route',
    type: [RouteSubRouteDto],
  })
  sub_routes!: RouteSubRouteDto[]

  @ApiProperty({ description: 'Stops for this route', type: [RouteStopDto] })
  stops!: RouteStopDto[]
}
