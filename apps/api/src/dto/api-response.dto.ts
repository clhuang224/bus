import { ApiProperty } from '@nestjs/swagger'
import { ErrorCode } from '@bus/shared'

export class ApiSuccessResponseDto {
  @ApiProperty({ description: 'HTTP response status code.', example: 200 })
  status!: number

  @ApiProperty({
    description:
      'Optional user-facing message. Query endpoints usually return null.',
    nullable: true,
    example: null,
  })
  message!: string | null
}

export class ApiErrorDto {
  @ApiProperty({
    description: 'Stable project-level error code.',
    enum: ErrorCode,
    enumName: 'ErrorCode',
    example: ErrorCode.NOT_FOUND,
  })
  code!: ErrorCode

  @ApiProperty({
    description: 'User-facing error message for toast or fallback UI.',
    example: '找不到資料。',
  })
  message!: string
}

export class ApiErrorResponseDto {
  @ApiProperty({ description: 'HTTP response status code.', example: 404 })
  status!: number

  @ApiProperty({ type: ApiErrorDto })
  error!: ApiErrorDto
}
