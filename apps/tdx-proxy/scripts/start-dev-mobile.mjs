import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { networkInterfaces } from 'node:os'

const DEV_VARS_PATH = new URL('../.dev.vars', import.meta.url)
const WEB_MOBILE_ORIGIN_PORT = 5173
const ALLOW_ALL_ORIGINS = '*'

function readConfiguredAllowedOrigins() {
  if (!existsSync(DEV_VARS_PATH)) return []

  const allowedOriginsLine = readFileSync(DEV_VARS_PATH, 'utf8')
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith('ALLOWED_ORIGINS='))

  return (allowedOriginsLine?.split('=').slice(1).join('=') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

function getLanOrigins() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((address) => address?.family === 'IPv4' && !address.internal)
    .map((address) => `https://${address.address}:${WEB_MOBILE_ORIGIN_PORT}`)
}

const configuredOrigins = readConfiguredAllowedOrigins()
const lanOrigins = getLanOrigins()
const allowedOriginsArgs = configuredOrigins.includes(ALLOW_ALL_ORIGINS)
  ? []
  : [
      '--var',
      `ALLOWED_ORIGINS:${[...new Set([...configuredOrigins, ...lanOrigins])].join(',')}`,
    ]

if (allowedOriginsArgs.length > 0) {
  console.log(`Allowing LAN origins for this session: ${lanOrigins.join(', ')}`)
}

const wranglerArgs = [
  'exec',
  'wrangler',
  'dev',
  '--config',
  'wrangler.jsonc',
  '--port',
  '3000',
  '--ip',
  '0.0.0.0',
  ...allowedOriginsArgs,
]
const isWindows = process.platform === 'win32'
const command = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'pnpm'
const args = isWindows
  ? ['/d', '/s', '/c', ['pnpm.cmd', ...wranglerArgs].join(' ')]
  : wranglerArgs
const wranglerProcess = spawn(command, args, { stdio: 'inherit' })

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    wranglerProcess.kill(signal)
  })
}

wranglerProcess.on('exit', (code) => {
  process.exit(code ?? 1)
})
