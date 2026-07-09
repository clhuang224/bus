const PRISMA_INVOCATION_MARKER = /^Invalid `.+` invocation/

export function getSyncErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const lines = message
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.some((line) => PRISMA_INVOCATION_MARKER.test(line))) {
    const detail = lines.at(-1) ?? 'Unknown Prisma error.'
    return `Prisma query failed: ${removeLocalFilePaths(detail).trim()}`
  }

  return removeLocalFilePaths(message).trim()
}

function removeLocalFilePaths(message: string): string {
  return message.replace(
    /(?:[A-Za-z]:)?[\\/](?:[^\s:()\\/\n]+[\\/])*bus[\\/]([^\s)\n]+)/g,
    (_absolutePath, repoPath: string) => repoPath.replaceAll('\\', '/'),
  )
}
