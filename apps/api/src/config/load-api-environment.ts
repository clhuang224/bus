import { join } from 'node:path'
import { config as dotenvConfig } from 'dotenv'

export function loadApiEnvironment({
  env = process.env,
  directory = process.cwd(),
}: {
  env?: NodeJS.ProcessEnv
  directory?: string
} = {}): void {
  const isLocalApiMode = env.BUS_LOCAL_API_MODE === '1'

  dotenvConfig({ path: join(directory, '.env'), processEnv: env, quiet: true })
  dotenvConfig({
    path: join(directory, '.env.local'),
    processEnv: env,
    override: true,
    quiet: true,
  })

  if (isLocalApiMode) {
    env.PORT = '3001'
    env.CORS_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'
  }
}
