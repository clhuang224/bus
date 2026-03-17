/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_TDX_TOKEN: string
  readonly VITE_DEV_GEO_FALLBACK_LAT?: string
  readonly VITE_DEV_GEO_FALLBACK_LNG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
