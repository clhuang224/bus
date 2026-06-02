import { ApiProperty } from '@nestjs/swagger'

export class HealthResponseDto {
  @ApiProperty({
    description: 'Service health status',
    example: 'ok',
  })
  status!: 'ok'

  @ApiProperty({
    description: 'ISO-8601 timestamp when health was generated',
    example: '2026-06-02T12:00:00.000Z',
  })
  timestamp!: string
}
