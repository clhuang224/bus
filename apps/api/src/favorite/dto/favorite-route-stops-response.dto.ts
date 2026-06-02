import { ApiProperty } from '@nestjs/swagger'
import { CityNameType, DirectionType } from '@bus/shared'
import { LocalizedTextDto } from '../../dto/shared.dto.js'

export class FavoriteRouteRefDto {
  @ApiProperty({ description: 'Route UUID', example: 'route-1' })
  uuid!: string

  @ApiProperty({ description: 'Localized route name', type: LocalizedTextDto })
  name!: LocalizedTextDto
}

export class FavoriteSubRouteRefDto {
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
}

export class FavoriteStopRefDto {
  @ApiProperty({ description: 'Stop UUID', example: 'stop-1' })
  uuid!: string

  @ApiProperty({ description: 'Stop public ID', example: 'stop-id-1' })
  id!: string

  @ApiProperty({
    description: 'Station ID used to group physical stop signs',
    example: 'station-1',
    nullable: true,
  })
  station_id!: string | null

  @ApiProperty({
    description: 'Stable station key used by the app',
    example: 'station-1',
  })
  station_key!: string

  @ApiProperty({ description: 'Localized stop name', type: LocalizedTextDto })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Stop sequence in the selected direction',
    example: 1,
  })
  sequence!: number
}

export class FavoriteRouteStopDto {
  @ApiProperty({ description: 'Favorite UUID', example: 'favorite-1' })
  uuid!: string

  @ApiProperty({
    description: 'City where the route operates',
    enum: CityNameType,
  })
  city!: CityNameType

  @ApiProperty({
    description: 'Favorite route information',
    type: FavoriteRouteRefDto,
  })
  route!: FavoriteRouteRefDto

  @ApiProperty({
    description: 'Favorite sub-route information',
    type: FavoriteSubRouteRefDto,
  })
  sub_route!: FavoriteSubRouteRefDto

  @ApiProperty({
    description: 'Favorite stop information',
    type: FavoriteStopRefDto,
  })
  stop!: FavoriteStopRefDto
}

export class FavoriteRouteStopsResponseDto {
  @ApiProperty({
    description: 'Favorite route stops',
    type: [FavoriteRouteStopDto],
  })
  route_stops!: FavoriteRouteStopDto[]
}
