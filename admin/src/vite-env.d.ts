/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV?: "mainnet" | "testnet";
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_BASE_SEPOLIA_RPC?: string;
  readonly VITE_BASE_RPC?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PORTAL_API?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv; }
