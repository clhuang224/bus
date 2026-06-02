import { Controller, Get, Param } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { StopDetailResponseDto } from './dto/stops-response.dto.js'
import { StopsService } from './stops.service.js'

@ApiTags('stops')
@Controller('stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @ApiOperation({ summary: 'Get stop detail' })
  @ApiOkResponse({ type: StopDetailResponseDto })
  @Get(':uuid')
  getStop(@Param('uuid') uuid: string): StopDetailResponseDto {
    return this.stopsService.getStop(uuid)
  }
}
