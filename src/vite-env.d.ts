/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AIRTABLE_API_KEY: string
  readonly VITE_AIRTABLE_BASE_ID: string
  readonly VITE_AIRTABLE_TABLE_NAME: string
  readonly VITE_PAYMENT_GATEWAY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}