import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [reactRouter(), tsconfigPaths()],
  server: {
    ...(mode === 'local-api' ? { port: 5173, strictPort: true } : {}),
    proxy: {
      '/api/tdx': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
}))
