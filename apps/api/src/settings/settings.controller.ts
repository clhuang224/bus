import { Body, Controller, Get, Patch } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  SettingsResponseDto,
  UpdateSettingsRequestDto,
} from './dto/settings-response.dto.js'
import { SettingsService } from './settings.service.js'

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiOperation({
    summary: 'Get settings',
    description:
      'WARNING: Backlog placeholder. This endpoint should wait until account/auth work starts because settings sync is user-specific and currently remains frontend-local.',
  })
  @ApiOkResponse({ type: SettingsResponseDto })
  @Get()
  getSettings(): SettingsResponseDto {
    return this.settingsService.getSettings()
  }

  @ApiOperation({
    summary: 'Update settings',
    description:
      'WARNING: Backlog placeholder. This endpoint should wait until account/auth work starts because settings sync is user-specific and currently remains frontend-local.',
  })
  @ApiOkResponse({ type: SettingsResponseDto })
  @Patch()
  updateSettings(@Body() body: UpdateSettingsRequestDto): SettingsResponseDto {
    return this.settingsService.updateSettings(body)
  }
}
