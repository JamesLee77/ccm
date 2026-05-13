/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_BASE_SEPOLIA_RPC?: string;
  readonly VITE_BASE_RPC?: string;
  readonly VITE_API_BASE_URL?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
