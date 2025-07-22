/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_API_BASE: string
  readonly VITE_TDX_ID: string
  readonly VITE_TDX_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}