import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  ApiDefaultErrorResponses,
  ApiSuccessResponse,
} from './dto/api-response.decorator.js'
import { AppService } from './app.service.js'
import { HealthResponseDto } from './dto/health-response.dto.js'

@ApiTags('system')
@ApiDefaultErrorResponses()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Health check' })
  @ApiSuccessResponse({
    description: 'API is healthy',
    type: HealthResponseDto,
  })
  @Get('health')
  getHealth(): HealthResponseDto {
    return this.appService.getHealth()
  }
}
