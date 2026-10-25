import { reactRouter } from '@react-router/dev/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import type { TLSSocket } from 'node:tls'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
  base: '/',
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    ...(mode === 'mobile' ? [basicSsl()] : []),
  ],
  server: {
    ...(mode === 'local-api' ? { port: 5173, strictPort: true } : {}),
    proxy: {
      '/api/tdx': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (!req.headers.origin && req.headers.host) {
              const protocol = (req.socket as TLSSocket).encrypted
                ? 'https'
                : 'http'
              proxyReq.setHeader('Origin', `${protocol}://${req.headers.host}`)
            }
          })
        },
      },
    },
  },
}))
