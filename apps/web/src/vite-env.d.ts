/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_AI_ASSISTANT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
