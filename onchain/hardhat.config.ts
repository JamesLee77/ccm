import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "solidity-coverage";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env from the repo root (ccm/.env), not onchain/.env.
// The repo root is one directory up from this config file.
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
// Mainnet uses a separate key namespace (MAINNET_PRIVATE_KEY) so testnet
// activity can't accidentally sign mainnet transactions. Falls back to
// PRIVATE_KEY if not set, preserving existing testnet-only configs.
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY || PRIVATE_KEY;
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC || "https://mainnet.base.org";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      // Interval mining ensures tx.wait(2) resolves in dry-run / fork scripts.
      // Auto-mine is also on so each tx gets its own block; the 1000ms interval
      // then mines the 2nd confirmation block without requiring another tx.
      mining: {
        auto: true,
        interval: 1000,
      },
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 84532,
    },
    base: {
      url: BASE_MAINNET_RPC,
      accounts: [MAINNET_PRIVATE_KEY],
      chainId: 8453,
    },
  },
  // Etherscan v2 unified API (single key works across all supported chains)
  etherscan: {
    apiKey: BASESCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
