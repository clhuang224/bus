import { spawn } from 'node:child_process'

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const apiProcess = spawn(pnpmCommand, ['run', 'start:dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    BUS_LOCAL_API_MODE: '1',
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
