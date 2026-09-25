import { spawn } from 'node:child_process'

const isWindows = process.platform === 'win32'
const command = isWindows ? (process.env.ComSpec ?? 'cmd.exe') : 'pnpm'
const args = isWindows
  ? ['/d', '/s', '/c', 'pnpm.cmd run start:dev']
  : ['run', 'start:dev']
const apiProcess = spawn(command, args, {
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
