import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { NearbyStopsResponseDto } from './dto/nearby-stops-response.dto.js'
import { NearbyService } from './nearby.service.js'

@ApiTags('nearby')
@Controller('nearby-stops')
export class NearbyController {
  constructor(private readonly nearbyService: NearbyService) {}

  @ApiOperation({ summary: 'List nearby stops' })
  @ApiOkResponse({ type: NearbyStopsResponseDto })
  @Get()
  listNearbyStops(): NearbyStopsResponseDto {
    return this.nearbyService.listNearbyStops()
  }
}
