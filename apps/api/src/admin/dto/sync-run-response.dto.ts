import { ApiProperty } from '@nestjs/swagger'
import { CityNameType, SyncResourceType, SyncStatusType } from '@bus/shared'

export class SyncRunSummaryResponseDto {
  @ApiProperty({
    description: 'Sync run UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid!: string

  @ApiProperty({
    description: 'Resource being synced',
    enum: SyncResourceType,
    example: SyncResourceType.STOPS,
  })
  resource!: SyncResourceType

  @ApiProperty({
    description: 'Sync status',
    enum: SyncStatusType,
    example: SyncStatusType.RUNNING,
  })
  status!: SyncStatusType

  @ApiProperty({
    description: 'Timestamp when the sync run was created',
    example: '2026-07-07T12:00:00.000Z',
  })
  created_at!: string

  @ApiProperty({
    description: 'Timestamp when the sync run was last updated',
    example: '2026-07-07T12:10:00.000Z',
  })
  updated_at!: string

  @ApiProperty({
    description: 'Timestamp when the sync run started',
    example: '2026-07-07T12:00:05.000Z',
    nullable: true,
  })
  started_at!: string | null

  @ApiProperty({
    description: 'Timestamp when the sync run finished',
    example: null,
    nullable: true,
  })
  finished_at!: string | null

  @ApiProperty({
    description: 'Earliest timestamp when a pending sync run can resume',
    example: null,
    nullable: true,
  })
  resume_after_at!: string | null

  @ApiProperty({
    description: 'Number of upstream records read by the sync run',
    example: 12000,
  })
  records_read!: number

  @ApiProperty({
    description: 'Number of local records created by the sync run',
    example: 8000,
  })
  records_created!: number

  @ApiProperty({
    description: 'Number of local records updated by the sync run',
    example: 4000,
  })
  records_updated!: number

  @ApiProperty({
    description: 'Number of local records marked inactive by the sync run',
    example: 0,
  })
  records_deactivated!: number

  @ApiProperty({
    description: 'Top-level sync error message when the run fails',
    example: null,
    nullable: true,
  })
  error_message!: string | null
}

export class SyncRunCityResponseDto {
  @ApiProperty({
    description: 'City checkpoint for the sync run',
    enum: CityNameType,
    example: CityNameType.TAIPEI,
  })
  city!: CityNameType

  @ApiProperty({
    description: 'City checkpoint status',
    enum: SyncStatusType,
    example: SyncStatusType.SUCCEEDED,
  })
  status!: SyncStatusType

  @ApiProperty({
    description: 'Timestamp when the city sync started',
    example: '2026-07-07T12:00:05.000Z',
    nullable: true,
  })
  started_at!: string | null

  @ApiProperty({
    description: 'Timestamp when the city sync finished',
    example: '2026-07-07T12:05:00.000Z',
    nullable: true,
  })
  finished_at!: string | null

  @ApiProperty({
    description: 'Timestamp when the city checkpoint was last updated',
    example: '2026-07-07T12:05:00.000Z',
  })
  updated_at!: string

  @ApiProperty({
    description: 'Number of upstream records read for this city',
    example: 28772,
  })
  records_read!: number

  @ApiProperty({
    description: 'Number of local records created for this city',
    example: 12000,
  })
  records_created!: number

  @ApiProperty({
    description: 'Number of local records updated for this city',
    example: 16000,
  })
  records_updated!: number

  @ApiProperty({
    description: 'Number of local records marked inactive for this city',
    example: 0,
  })
  records_deactivated!: number

  @ApiProperty({
    description: 'City-level sync error message when the checkpoint fails',
    example: null,
    nullable: true,
  })
  error_message!: string | null
}

export class SyncRunDetailResponseDto extends SyncRunSummaryResponseDto {
  @ApiProperty({
    description: 'Per-city sync checkpoints',
    type: [SyncRunCityResponseDto],
  })
  cities!: SyncRunCityResponseDto[]
}
