import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { SettingsResponseDto } from './dto/settings-response.dto.js'
import { SettingsService } from './settings.service.js'

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Get settings sync state' })
  @ApiOkResponse({ type: SettingsResponseDto })
  @Get()
  getSettings(): SettingsResponseDto {
    return this.settingsService.getSettings()
  }
}
