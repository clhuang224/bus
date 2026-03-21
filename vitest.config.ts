import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [tsconfigPaths()],
    define: {
      'import.meta.env.VITE_PROXY_API_BASE_URL': JSON.stringify(env.VITE_PROXY_API_BASE_URL)
    },
    test: {
      environment: 'node',
      include: ['app/**/*.test.ts', 'app/**/*.test.tsx'],
      setupFiles: ['app/test/setup.ts']
    }
  }
})
