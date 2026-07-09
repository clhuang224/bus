import { getSyncErrorMessage } from './sync-error-message.js'

describe('getSyncErrorMessage', () => {
  it('removes local Prisma invocation paths and code frames', () => {
    const error = new Error(`
Invalid \`this.prismaService.stop.updateMany()\` invocation in
/tmp/example-workspace/bus/apps/api/src/sync/stop-persistence.service.ts:206:60

  203 }
  204
  205 const inactiveAt = new Date()
→ 206 const deactivatedStops = await this.prismaService.stop.updateMany(
The query parameter limit supported by your database is exceeded.`)

    expect(getSyncErrorMessage(error)).toBe(
      'Prisma query failed: The query parameter limit supported by your database is exceeded.',
    )
  })

  it('keeps repo-relative paths from Prisma error detail lines', () => {
    const error = new Error(`
Invalid \`this.prismaService.stop.updateMany()\` invocation
Failed at /tmp/example-workspace/bus/apps/api/src/sync/stop-persistence.service.ts:206:60`)

    expect(getSyncErrorMessage(error)).toBe(
      'Prisma query failed: Failed at apps/api/src/sync/stop-persistence.service.ts:206:60',
    )
  })

  it('keeps repo-relative paths from non-Prisma errors', () => {
    expect(
      getSyncErrorMessage(
        new Error(
          'Failed at /tmp/example-workspace/bus/apps/api/src/main.ts:1:2',
        ),
      ),
    ).toBe('Failed at apps/api/src/main.ts:1:2')
  })

  it('keeps repo-relative paths for Windows-style paths', () => {
    expect(
      getSyncErrorMessage(
        new Error(
          String.raw`Failed at C:\tmp\example-workspace\bus\apps\api\src\main.ts:1:2`,
        ),
      ),
    ).toBe('Failed at apps/api/src/main.ts:1:2')
  })

  it('keeps repo-relative paths when line and column are missing', () => {
    expect(
      getSyncErrorMessage(
        new Error('Failed at /tmp/example-workspace/bus/apps/api/src/main.ts'),
      ),
    ).toBe('Failed at apps/api/src/main.ts')
  })

  it('does not treat repeated non-repo segments as a local repo path', () => {
    const noisyPath = `/${'!/'.repeat(100)}not-the-repo/apps/api/src/main.ts`

    expect(getSyncErrorMessage(new Error(`Failed at ${noisyPath}`))).toBe(
      `Failed at ${noisyPath}`,
    )
  })
})
