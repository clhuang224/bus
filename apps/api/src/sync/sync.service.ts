import { Injectable } from '@nestjs/common'

@Injectable()
export class SyncService {
  // TODO(sync): Own background dispatch and resume behavior.
  // Admin controllers should create sync_run rows quickly, then this service
  // should decide which resource-specific sync service runs next. Pending runs
  // should resume when resume_after_at is reached.
}
