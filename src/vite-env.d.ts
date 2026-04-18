/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_TWELVEDATA_KEY: string
  readonly VITE_PUTER_API_KEY: string
  readonly VITE_NEXUS_VAULT_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
