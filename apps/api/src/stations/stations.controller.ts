import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseFloatPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { StationsResponseDto } from './dto/stations-response.dto.js'
import { StationsService } from './stations.service.js'

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
    description: 'Current user latitude.',
    example: 24.9939,
  })
  @ApiQuery({
    name: 'longitude',
    type: Number,
    required: true,
    description: 'Current user longitude.',
    example: 121.5047,
  })
  @ApiQuery({
    name: 'radius_meters',
    type: Number,
    required: false,
    description: 'Search radius in meters.',
    example: 500,
  })
  @ApiOkResponse({ type: StationsResponseDto })
  @Get()
  listStations(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius_meters', new DefaultValuePipe(500), ParseIntPipe)
    radiusMeters: number,
  ): StationsResponseDto {
    return this.stationsService.listStations({
      latitude,
      longitude,
      radius_meters: radiusMeters,
    })
  }
}
