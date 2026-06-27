const PROGRESS_LOG_SEGMENTS = 10

export function createProgressCounter(totalCount: number) {
  const interval = Math.max(1, Math.ceil(totalCount / PROGRESS_LOG_SEGMENTS))
  let nextProgressCount = interval

  return {
    shouldReport(persistedCount: number): boolean {
      if (persistedCount >= totalCount) return true
      if (persistedCount < nextProgressCount) return false

      while (nextProgressCount <= persistedCount) {
        nextProgressCount += interval
      }

      return true
    },
  }
}
