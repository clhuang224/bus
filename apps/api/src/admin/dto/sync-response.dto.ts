import { ApiProperty } from '@nestjs/swagger'
import { SyncResourceType, SyncStatusType } from '@bus/shared'

export class SyncResponseDto {
  @ApiProperty({
    description: 'Sync run UUID when a run is created',
    example: null,
    nullable: true,
  })
  uuid!: string | null

  @ApiProperty({ description: 'Resource being synced', enum: SyncResourceType })
  resource!: SyncResourceType

  @ApiProperty({ description: 'Sync status', enum: SyncStatusType })
  status!: SyncStatusType

  @ApiProperty({
    description: 'Sync request creation timestamp',
    example: null,
    nullable: true,
  })
  created_at!: string | null
}
