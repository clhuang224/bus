import type { Config } from '@react-router/dev/config'

export default {
  basename: process.env.NODE_ENV === 'production' ? '/bus/' : '/',
  ssr: false
} satisfies Config
