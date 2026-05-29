import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const rootDir = new URL('../..', import.meta.url).pathname

export default defineConfig(() => ({
  base: '/',
  envDir: rootDir,
  plugins: [reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      '/api/tdx': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    }
  }
}))
