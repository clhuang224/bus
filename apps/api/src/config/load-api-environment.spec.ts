import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadApiEnvironment } from './load-api-environment.js'

describe('loadApiEnvironment', () => {
  let directory: string

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'bus-api-environment-'))
    writeFileSync(
      join(directory, '.env'),
      'PORT=3100\nCORS_ORIGINS=https://default.example\n',
    )
    writeFileSync(
      join(directory, '.env.local'),
      'PORT=3999\nCORS_ORIGINS=https://local.example\nBUS_LOCAL_API_MODE=0\n',
    )
  })

  afterEach(() => {
    rmSync(directory, { recursive: true, force: true })
  })

  it('applies local API settings after loading conflicting dotenv values', () => {
    const env: NodeJS.ProcessEnv = { BUS_LOCAL_API_MODE: '1' }

    loadApiEnvironment({ env, directory })

    expect(env.PORT).toBe('3001')
    expect(env.CORS_ORIGINS).toBe('http://localhost:5173,http://127.0.0.1:5173')
  })

  it('preserves dotenv configuration for normal startup', () => {
    const env: NodeJS.ProcessEnv = {}

    loadApiEnvironment({ env, directory })

    expect(env.PORT).toBe('3999')
    expect(env.CORS_ORIGINS).toBe('https://local.example')
  })

  it('keeps normal startup configurable without dotenv files', () => {
    const env: NodeJS.ProcessEnv = {
      PORT: '8080',
      CORS_ORIGINS: 'https://app.example',
    }

    loadApiEnvironment({ env, directory: join(directory, 'missing') })

    expect(env.PORT).toBe('8080')
    expect(env.CORS_ORIGINS).toBe('https://app.example')
  })
})
