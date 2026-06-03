import { ApiProperty } from '@nestjs/swagger'
import { BearingType, CityNameType, DirectionType } from '@bus/shared'
import { LocalizedTextDto, PositionDto } from '../../dto/shared.dto.js'

export class StationRouteDto {
  @ApiProperty({ description: 'Route UUID', example: 'NWT10116' })
  uuid!: string

  @ApiProperty({
    description: 'City where the route operates',
    enum: CityNameType,
    example: CityNameType.NEW_TAIPEI,
  })
  city!: CityNameType

  @ApiProperty({
    description: 'Localized route name',
    type: LocalizedTextDto,
    example: { zh_tw: '242', en: '242' },
  })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Localized route departure stop name',
    type: LocalizedTextDto,
    example: { zh_tw: '中和', en: 'Zhonghe' },
  })
  departure!: LocalizedTextDto

  @ApiProperty({
    description: 'Localized route destination stop name',
    type: LocalizedTextDto,
    example: { zh_tw: '西門', en: 'Ximen' },
  })
  destination!: LocalizedTextDto
}

export class StationRouteDirectionDto {
  @ApiProperty({
    description: 'Route direction serving this station',
    enum: DirectionType,
    example: DirectionType.GO,
  })
  direction!: DirectionType

  @ApiProperty({
    description: 'Routes serving this station in the given direction',
    type: [StationRouteDto],
  })
  routes!: StationRouteDto[]
}

export class StationDto {
  @ApiProperty({ description: 'Station UUID', example: 'NWT1001' })
  uuid!: string

  @ApiProperty({
    description: 'City where the station is located',
    enum: CityNameType,
    nullable: true,
    example: CityNameType.NEW_TAIPEI,
  })
  city!: CityNameType | null

  @ApiProperty({
    description: 'Localized station name',
    type: LocalizedTextDto,
    example: { zh_tw: '捷運景安站', en: 'MRT Jingan Sta.' },
  })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Station address merged from stop signs in this station group',
    example: '景平路近景安路',
    nullable: true,
  })
  address!: string | null

  @ApiProperty({
    description: 'Bearing direction for the station group',
    enum: BearingType,
    nullable: true,
  })
  bearing!: BearingType | null

  @ApiProperty({
    description: 'Representative station position',
    type: PositionDto,
  })
  position!: PositionDto

  @ApiProperty({
    description: 'Distance from query coordinates in meters',
    example: 120,
  })
  distance_meters!: number

  @ApiProperty({
    description:
      'Routes grouped by direction. The backend resolves stop signs, stop-of-route data, and route terminals before returning this page-ready model.',
    type: [StationRouteDirectionDto],
  })
  route_directions!: StationRouteDirectionDto[]
}

export class StationsResponseDto {
  @ApiProperty({
    description:
      'Nearby station groups sorted by distance from the query coordinates.',
    type: [StationDto],
    example: [
      {
        uuid: 'NWT1001',
        city: CityNameType.NEW_TAIPEI,
        name: { zh_tw: '捷運景安站', en: 'MRT Jingan Sta.' },
        address: '景平路近景安路',
        bearing: BearingType.EAST,
        position: { latitude: 24.9939, longitude: 121.5047 },
        distance_meters: 120,
        route_directions: [
          {
            direction: DirectionType.GO,
            routes: [
              {
                uuid: 'NWT10116',
                city: CityNameType.NEW_TAIPEI,
                name: { zh_tw: '242', en: '242' },
                departure: { zh_tw: '中和', en: 'Zhonghe' },
                destination: { zh_tw: '西門', en: 'Ximen' },
              },
            ],
          },
          {
            direction: DirectionType.RETURN,
            routes: [
              {
                uuid: 'NWT10143',
                city: CityNameType.NEW_TAIPEI,
                name: { zh_tw: '棕7', en: 'BR7' },
                departure: { zh_tw: '新店', en: 'Xindian Station' },
                destination: { zh_tw: '臺北市政府', en: 'Taipei City Hall' },
              },
            ],
          },
        ],
      },
    ],
  })
  stations!: StationDto[]
}
