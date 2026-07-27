import { Controller, DefaultValuePipe, Get, Query } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiSuccessResponse } from '../dto/api-response.decorator.js'
import { ParseStrictNumberPipe } from '../dto/parse-strict-number.pipe.js'
import { StationsResponseDto } from './dto/stations-response.dto.js'
import {
  DEFAULT_STATION_SEARCH_RADIUS_METERS,
  MAX_STATION_SEARCH_RADIUS_METERS,
  MIN_STATION_SEARCH_RADIUS_METERS,
  StationsService,
} from './stations.service.js'

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @ApiOperation({
    summary: 'List stations near coordinates',
    description:
      'Returns station-level nearby results for the current user position. Latitude and longitude are required; requests without coordinates are rejected. The backend groups physical stop signs by station and resolves route directions before returning this page-ready model.',
  })
  @ApiQuery({
    name: 'latitude',
    type: Number,
    required: true,
    description: 'Current user latitude. Allowed range is -90 to 90.',
    example: 24.9939,
    minimum: -90,
    maximum: 90,
  })
  @ApiQuery({
    name: 'longitude',
    type: Number,
    required: true,
    description: 'Current user longitude. Allowed range is -180 to 180.',
    example: 121.5047,
    minimum: -180,
    maximum: 180,
  })
  @ApiQuery({
    name: 'radius_meters',
    type: 'integer',
    required: false,
    description: `Integer search radius in meters. Defaults to ${DEFAULT_STATION_SEARCH_RADIUS_METERS}; allowed range is ${MIN_STATION_SEARCH_RADIUS_METERS} to ${MAX_STATION_SEARCH_RADIUS_METERS}.`,
    example: DEFAULT_STATION_SEARCH_RADIUS_METERS,
    minimum: MIN_STATION_SEARCH_RADIUS_METERS,
    maximum: MAX_STATION_SEARCH_RADIUS_METERS,
  })
  @ApiSuccessResponse({ type: StationsResponseDto })
  @Get()
  listStations(
    @Query('latitude', new ParseStrictNumberPipe('latitude')) latitude: number,
    @Query('longitude', new ParseStrictNumberPipe('longitude'))
    longitude: number,
    @Query(
      'radius_meters',
      new DefaultValuePipe(DEFAULT_STATION_SEARCH_RADIUS_METERS),
      new ParseStrictNumberPipe('radius_meters'),
    )
    radiusMeters: number,
  ): Promise<StationsResponseDto> {
    return this.stationsService.listStations({
      latitude,
      longitude,
      radius_meters: radiusMeters,
    })
  }
}
