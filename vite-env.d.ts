/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_PROXY_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
