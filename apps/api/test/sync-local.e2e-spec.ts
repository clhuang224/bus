import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const scriptUrl = new URL('../scripts/sync-local.mjs', import.meta.url).href

describe('Local sync commands', () => {
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'bus-sync-local-'))
    writeFileSync(join(directory, '.env.local'), 'ADMIN_API_KEY=test-key\n')
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  function runSync(resource: string, localApiMode: boolean): unknown {
    const env = { ...process.env }
    delete env.API_ORIGIN
    const args = [resource, ...(localApiMode ? ['--local-api'] : [])]
    const output = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '--eval',
        `
          globalThis.fetch = async (url, options) => ({
            ok: true,
            text: async () => JSON.stringify({ url, ...options }),
          });
          process.argv = [process.execPath, ${JSON.stringify(scriptUrl)}, ...${JSON.stringify(args)}];
          await import(${JSON.stringify(scriptUrl)});
        `,
      ],
      { cwd: directory, env, encoding: 'utf8' },
    )

    return JSON.parse(output) as unknown
  }

  it.each(['routes', 'stops'])(
    'queues %s on port 3001 in local API mode despite a conflicting API_ORIGIN',
    (resource) => {
      writeFileSync(
        join(directory, '.env.local'),
        'ADMIN_API_KEY=test-key\nAPI_ORIGIN=http://localhost:3999\n',
      )

      expect(runSync(resource, true)).toEqual({
        url: `http://localhost:3001/api/admin/sync/${resource}`,
        method: 'POST',
        headers: { 'x-admin-api-key': 'test-key' },
      })
    },
  )

  it('keeps port 3000 as the default for standalone API sync', () => {
    expect(runSync('routes', false)).toMatchObject({
      url: 'http://localhost:3000/api/admin/sync/routes',
    })
  })

  it('honors API_ORIGIN for standalone API sync', () => {
    writeFileSync(
      join(directory, '.env.local'),
      'ADMIN_API_KEY=test-key\nAPI_ORIGIN=http://localhost:3999\n',
    )

    expect(runSync('stops', false)).toMatchObject({
      url: 'http://localhost:3999/api/admin/sync/stops',
    })
  })
})
