import { ApiProperty } from '@nestjs/swagger'
import { CityNameType, DirectionType } from '@bus/shared'
import { LocalizedTextDto } from '../../dto/shared.dto.js'

export class FavoriteRouteRefDto {
  @ApiProperty({ description: 'Route UUID', example: 'TPE16111' })
  uuid!: string

  @ApiProperty({
    description: 'Localized route name',
    type: LocalizedTextDto,
    example: { 'zh-TW': '307', en: '307' },
  })
  name!: LocalizedTextDto
}

export class FavoriteSubRouteRefDto {
  @ApiProperty({ description: 'Sub-route UUID', example: 'TPE157463' })
  uuid!: string

  @ApiProperty({
    description: 'Localized sub-route name',
    type: LocalizedTextDto,
    example: { 'zh-TW': '307莒光往撫遠街', en: '307' },
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
    example: { 'zh-TW': '板橋', en: 'Banqiao' },
  })
  departure!: LocalizedTextDto

  @ApiProperty({
    description: 'Localized destination stop name',
    type: LocalizedTextDto,
    example: { 'zh-TW': '撫遠街', en: 'Fuyuan St.' },
  })
  destination!: LocalizedTextDto
}

export class FavoriteStopRefDto {
  @ApiProperty({ description: 'Stop UUID', example: 'TPE15204' })
  uuid!: string

  @ApiProperty({ description: 'Stop public ID', example: '15204' })
  id!: string

  @ApiProperty({
    description: 'Station ID used to group physical stop signs',
    example: '60094',
    nullable: true,
  })
  station_id!: string | null

  @ApiProperty({
    description: 'Stable station key used by the app',
    example: '60094',
  })
  station_key!: string

  @ApiProperty({
    description: 'Localized stop name',
    type: LocalizedTextDto,
    example: { 'zh-TW': '北門街(黃石市場)', en: 'Beimen St.(Huangshi Market)' },
  })
  name!: LocalizedTextDto

  @ApiProperty({
    description: 'Stop sequence in the selected direction',
    example: 10,
  })
  sequence!: number
}

export class FavoriteRouteStopDto {
  @ApiProperty({
    description: 'Favorite route-stop UUID',
    example: 'TPE16111-TPE157463-0-60094',
  })
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

export class CreateFavoriteRouteStopRequestDto {
  @ApiProperty({
    description: 'Favorite route-stop UUID',
    example: 'TPE16111-TPE157463-0-60094',
  })
  uuid!: string

  @ApiProperty({
    description: 'City where the route operates',
    enum: CityNameType,
    example: CityNameType.TAIPEI,
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
    example: [
      {
        uuid: 'TPE16111-TPE157463-0-60094',
        city: CityNameType.TAIPEI,
        route: {
          uuid: 'TPE16111',
          name: { 'zh-TW': '307', en: '307' },
        },
        sub_route: {
          uuid: 'TPE157463',
          name: { 'zh-TW': '307莒光往撫遠街', en: '307' },
          direction: DirectionType.GO,
          departure: { 'zh-TW': '板橋', en: 'Banqiao' },
          destination: { 'zh-TW': '撫遠街', en: 'Fuyuan St.' },
        },
        stop: {
          uuid: 'TPE15204',
          id: '15204',
          station_id: '60094',
          station_key: '60094',
          name: {
            'zh-TW': '北門街(黃石市場)',
            en: 'Beimen St.(Huangshi Market)',
          },
          sequence: 10,
        },
      },
    ],
  })
  route_stops!: FavoriteRouteStopDto[]
}
