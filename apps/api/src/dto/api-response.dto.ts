import { ApiProperty } from '@nestjs/swagger'
import { ErrorCode } from '@bus/shared'

export class ApiSuccessResponseDto {
  @ApiProperty({ description: 'HTTP response status code.' })
  status!: number

  @ApiProperty({
    description:
      'Optional user-facing message. Query endpoints usually return null.',
    nullable: true,
  })
  message!: string | null
}

export class ApiErrorDto {
  @ApiProperty({
    description: 'Stable project-level error code.',
    enum: ErrorCode,
    enumName: 'ErrorCode',
  })
  code!: ErrorCode

  @ApiProperty({
    description: 'User-facing error message for toast or fallback UI.',
  })
  message!: string
}

export class ApiErrorResponseDto {
  @ApiProperty({ description: 'HTTP response status code.' })
  status!: number

  @ApiProperty({ type: ApiErrorDto })
  error!: ApiErrorDto
}
