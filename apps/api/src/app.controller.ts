import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({
    description: 'API is healthy',
    type: HealthResponseDto,
  })
  @Get('health')
  getHealth(): HealthResponseDto {
    return this.appService.getHealth();
  }
}
