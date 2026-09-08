import { spawn } from 'node:child_process'

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const apiProcess = spawn(pnpmCommand, ['run', 'start:dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '3001',
    CORS_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
  },
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    apiProcess.kill(signal)
  })
}

apiProcess.on('exit', (code) => {
  process.exit(code ?? 1)
})
