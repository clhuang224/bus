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

export class RouteStopDto {
  @ApiProperty({ description: 'Stop UUID', example: 'NWT121560' })
  uuid!: string

  @ApiProperty({
    description: 'Station UUID used to group physical stop signs',
    example: 'NWT1001',
    nullable: true,
  })
  station_uuid!: string | null

  @ApiProperty({
    description: 'Stop sequence in the sub-route direction',
    example: 1,
  })
  sequence!: number

  @ApiProperty({
    description: 'Localized stop name',
    type: LocalizedTextDto,
    example: { zh_tw: '中和站', en: 'Zhonghe Station' },
  })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Stop position',
    type: PositionDto,
    nullable: true,
    example: { latitude: 25.0018, longitude: 121.4984 },
  })
  position!: PositionDto | null
}

export class RouteShapeDto {
  @ApiProperty({
    description:
      'Decoded route shape path. If upstream shape data is unavailable, the backend falls back to ordered stop positions.',
    type: [PositionDto],
    example: [
      { latitude: 25.0018, longitude: 121.4984 },
      { latitude: 25.0042, longitude: 121.5021 },
    ],
  })
  path!: PositionDto[]

  @ApiProperty({
    description:
      'Timestamp for the route shape data used to build this path. When falling back to stop positions, this is the timestamp of the base data used for the fallback.',
    example: '2026-06-03T18:25:13+08:00',
  })
  updated_at!: string
}

export class RouteSubRouteDto {
  @ApiProperty({ description: 'Sub-route UUID', example: 'NWT101160' })
  uuid!: string

  @ApiProperty({
    description: 'Localized sub-route name',
    type: LocalizedTextDto,
    example: { zh_tw: '242', en: '242' },
  })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Route direction',
    enum: DirectionType,
    example: DirectionType.GO,
  })
  direction!: DirectionType

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

  @ApiProperty({
    description: 'First bus time in HH:mm format',
    example: '05:30',
    nullable: true,
  })
  first_bus_time!: string | null

  @ApiProperty({
    description: 'Last bus time in HH:mm format',
    example: '17:10',
    nullable: true,
  })
  last_bus_time!: string | null

  @ApiProperty({ description: 'Stops for this route', type: [RouteStopDto] })
  stops!: RouteStopDto[]

  @ApiProperty({
    description:
      'Route shape for this sub-route direction. The frontend should render this path without caring whether it came from upstream shape data or a backend fallback.',
    type: RouteShapeDto,
  })
  shape!: RouteShapeDto
}

export class RouteDetailResponseDto extends RouteSummaryDto {
  @ApiProperty({
    description:
      'Sub-routes for this route. Each sub-route contains its ordered stops and shape path. Realtime data is intentionally excluded.',
    type: [RouteSubRouteDto],
    example: [
      {
        uuid: 'NWT101160',
        name: { zh_tw: '242', en: '242' },
        direction: DirectionType.GO,
        departure: { zh_tw: '中和', en: 'Zhonghe' },
        destination: { zh_tw: '西門', en: 'Ximen' },
        first_bus_time: '05:30',
        last_bus_time: '17:10',
        stops: [
          {
            uuid: 'NWT121560',
            station_uuid: 'NWT1001',
            sequence: 1,
            name: { zh_tw: '中和站', en: 'Zhonghe Station' },
            position: { latitude: 25.0018, longitude: 121.4984 },
          },
          {
            uuid: 'NWT121561',
            station_uuid: 'NWT1002',
            sequence: 2,
            name: {
              zh_tw: '智光商職',
              en: 'Chih-Kuang Vocational High School',
            },
            position: { latitude: 25.0042, longitude: 121.5021 },
          },
        ],
        shape: {
          path: [
            { latitude: 25.0018, longitude: 121.4984 },
            { latitude: 25.0042, longitude: 121.5021 },
          ],
          updated_at: '2026-06-03T18:25:13+08:00',
        },
      },
    ],
  })
  sub_routes!: RouteSubRouteDto[]
}
