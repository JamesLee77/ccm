/**
 * On-chain CarbonPriceOracle keeper — Worker hot path.
 *
 * Reads keeper private key from a Wrangler secret, signs an
 * `updatePrice(uint256, string)` tx, submits to the oracle on Base
 * Sepolia (rehearsal stack). Failures are caught upstream — this
 * module either succeeds or throws.
 */
import { createWalletClient, http, parseUnits, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import type { Env } from "./types";

const ORACLE_ABI = [
  {
    type: "function",
    name: "updatePrice",
    inputs: [
      { name: "newPrice", type: "uint256" },
      { name: "source", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

/**
 * Push the latest price on-chain. Throws on any failure (caller catches).
 */
export async function pushPriceOnChain(env: Env, priceUsd: number, source: string): Promise<Hex> {
  if (!env.CARBON_KEEPER_PRIVATE_KEY || !env.CARBON_ORACLE_ADDRESS) {
    throw new Error("on-chain push not configured (missing CARBON_KEEPER_PRIVATE_KEY / CARBON_ORACLE_ADDRESS)");
  }

  // viem parseUnits handles JS numbers via string conversion. Avoid float
  // precision loss by using up to 18 significant digits.
  // The contract stores 18-decimal fixed. priceUsd is e.g. 0.026898806792241256.
  const priceStr = priceUsd.toString();
  const priceWei = parseUnits(priceStr, 18);

  const rpc = env.CARBON_ORACLE_RPC ?? "https://sepolia.base.org";
  const oracleAddress = env.CARBON_ORACLE_ADDRESS as Address;
  const keeperKey = env.CARBON_KEEPER_PRIVATE_KEY.startsWith("0x")
    ? (env.CARBON_KEEPER_PRIVATE_KEY as Hex)
    : (`0x${env.CARBON_KEEPER_PRIVATE_KEY}` as Hex);

  const account = privateKeyToAccount(keeperKey);
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpc),
  });

  const hash = await client.writeContract({
    address: oracleAddress,
    abi: ORACLE_ABI,
    functionName: "updatePrice",
    args: [priceWei, source],
  });

  console.log("carbonOracle: pushed on-chain tx", hash, "price", priceStr, "from", account.address);
  return hash;
}
