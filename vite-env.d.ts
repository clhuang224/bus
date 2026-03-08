/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_TDX_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
