import { ApiProperty } from '@nestjs/swagger'
import { CityNameType, DirectionType } from '@bus/shared'
import { LocalizedTextDto, PositionDto } from '../../dto/shared.dto.js'

export class RouteSummaryDto {
  @ApiProperty({ description: 'Route UUID', example: 'NWT10116' })
  uuid!: string

  @ApiProperty({
    description: 'City where the route operates',
    enum: CityNameType,
    nullable: true,
    example: CityNameType.NEW_TAIPEI,
  })
  city!: CityNameType | null

  @ApiProperty({
    description: 'Localized route name',
    type: LocalizedTextDto,
    example: { zh_tw: '242', en: '242' },
  })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Localized departure stop name',
    type: LocalizedTextDto,
    example: { zh_tw: '中和', en: 'Zhonghe' },
  })
  departure!: LocalizedTextDto

  @ApiProperty({
    description: 'Localized destination stop name',
    type: LocalizedTextDto,
    example: { zh_tw: '西門', en: 'Ximen' },
  })
  destination!: LocalizedTextDto
}

export class RoutesResponseDto {
  @ApiProperty({
    description:
      'Base route search index for the selected area. Realtime data is intentionally excluded.',
    type: [RouteSummaryDto],
    example: [
      {
        uuid: 'NWT10116',
        city: CityNameType.NEW_TAIPEI,
        name: { zh_tw: '242', en: '242' },
        departure: { zh_tw: '中和', en: 'Zhonghe' },
        destination: { zh_tw: '西門', en: 'Ximen' },
      },
      {
        uuid: 'NWT10143',
        city: CityNameType.NEW_TAIPEI,
        name: { zh_tw: '棕7', en: 'BR7' },
        departure: { zh_tw: '新店', en: 'Xindian Station' },
        destination: { zh_tw: '臺北市政府', en: 'Taipei City Hall' },
      },
    ],
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
