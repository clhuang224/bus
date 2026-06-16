import { ApiProperty } from '@nestjs/swagger'
import { SyncResourceType, SyncStatusType } from '@bus/shared'

export class SyncResponseDto {
  @ApiProperty({
    description: 'Sync run UUID when a run is created',
    example: null,
    nullable: true,
  })
  uuid!: string | null

  @ApiProperty({
    description: 'Resource being synced',
    enum: SyncResourceType,
    example: SyncResourceType.ROUTES,
  })
  resource!: SyncResourceType

  @ApiProperty({
    description: 'Sync status',
    enum: SyncStatusType,
    example: SyncStatusType.QUEUED,
  })
  status!: SyncStatusType

  @ApiProperty({
    description: 'Timestamp when the sync run started',
    example: null,
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
    description: 'Number of upstream records read by the sync run',
    example: 0,
  })
  records_read!: number

  @ApiProperty({
    description: 'Number of local records created by the sync run',
    example: 0,
  })
  records_created!: number

  @ApiProperty({
    description: 'Number of local records updated by the sync run',
    example: 0,
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
