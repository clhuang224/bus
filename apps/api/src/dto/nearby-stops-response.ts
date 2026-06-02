import { ApiProperty } from '@nestjs/swagger';
import { BearingType } from '@bus/shared/enums/BearingType';
import { CityNameType } from '@bus/shared/enums/CityNameType';

export class NearbyStopNameDto {
  @ApiProperty({
    description: 'Traditional Chinese stop name',
    example: '民權建國路口',
  })
  zh_tw!: string;

  @ApiProperty({
    description: 'English stop name',
    example: 'Minquan & Jianguo Intersection',
  })
  en!: string;
}

export class NearbyStopPositionDto {
  @ApiProperty({ description: 'Latitude', example: 25.06236889 })
  lat!: number;

  @ApiProperty({ description: 'Longitude', example: 121.5364984 })
  lon!: number;
}

export class NearbyStopDto {
  @ApiProperty({
    description: 'Bearing direction of the nearby stop',
    enum: BearingType,
    example: BearingType.EAST,
  })
  bearing!: BearingType;

  @ApiProperty({
    description: 'City where the nearby stop is located',
    enum: CityNameType,
    example: CityNameType.NEW_TAIPEI,
  })
  city!: CityNameType;

  @ApiProperty({ description: 'Station ID', example: '1242' })
  station_id!: string;

  @ApiProperty({ description: 'Stop UID', example: 'NWT139342' })
  uid!: string;

  @ApiProperty({
    description: 'Stop address',
    example: '民權東路二段上近建國北路二段同向(向東)',
  })
  address!: string;

  @ApiProperty({ description: 'Localized stop name', type: NearbyStopNameDto })
  name!: NearbyStopNameDto;

  @ApiProperty({
    description: 'Geographic position',
    type: NearbyStopPositionDto,
  })
  position!: NearbyStopPositionDto;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-06-02T17:25:33+08:00',
  })
  updated_at!: string;
}

export class NearbyStopsResponseDto {
  @ApiProperty({
    description: 'Nearby stops information',
    type: [NearbyStopDto],
    example: [
      {
        bearing: 'E',
        city: 'NewTaipei',
        station_id: '1242',
        address: '民權東路二段上近建國北路二段同向(向東)',
        uid: 'NWT139342',
        name: {
          zh_tw: '民權建國路口',
          en: 'Minquan & Jianguo Intersection',
        },
        position: {
          lat: 25.06236889,
          lon: 121.5364984,
        },
        updated_at: '2026-06-02T17:25:33+08:00',
      },
    ],
  })
  stops!: NearbyStopDto[];
}
