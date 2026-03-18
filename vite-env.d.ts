/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_PROXY_API_BASE_URL?: string
  readonly VITE_DEV_GEO_FALLBACK_LAT?: string
  readonly VITE_DEV_GEO_FALLBACK_LNG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
