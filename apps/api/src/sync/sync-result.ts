export interface SyncResult {
  records_read: number
  records_created: number
  records_updated: number
  records_deactivated: number
}

export function createEmptySyncResult(): SyncResult {
  return {
    records_read: 0,
    records_created: 0,
    records_updated: 0,
    records_deactivated: 0,
  }
}

export function addSyncResult(target: SyncResult, source: SyncResult): void {
  target.records_read += source.records_read
  target.records_created += source.records_created
  target.records_updated += source.records_updated
  target.records_deactivated += source.records_deactivated
}
