/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL da API, incluindo o prefixo de versão. Ex.: http://localhost:8000/api/v1 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
