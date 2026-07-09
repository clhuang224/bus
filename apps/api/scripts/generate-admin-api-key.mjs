import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const apiKey = randomBytes(32).toString('hex')
const envLocalPath = fileURLToPath(new URL('../.env.local', import.meta.url))
const envLine = `ADMIN_API_KEY="${apiKey}"`
const envContent = existsSync(envLocalPath)
  ? readFileSync(envLocalPath, 'utf8')
  : ''
const lines = envContent.split(/\r?\n/)
const keyLineIndex = lines.findIndex((line) => /^ADMIN_API_KEY\s*=/.test(line))
let nextEnvContent

if (keyLineIndex >= 0) {
  lines[keyLineIndex] = envLine
  nextEnvContent = lines.join('\n').replace(/\n*$/, '\n')
} else {
  nextEnvContent = envContent.trim()
    ? `${envContent.replace(/\n*$/, '')}\n${envLine}\n`
    : `${envLine}\n`
}

writeFileSync(envLocalPath, nextEnvContent, { mode: 0o600 })

console.log('ADMIN_API_KEY generated and saved to .env.local.')
