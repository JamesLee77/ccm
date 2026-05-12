import { api, ApiError } from "./api";
import type { WalletClient } from "viem";

export async function signInWithEthereum(opts: {
  walletClient: WalletClient;
  address: `0x${string}`;
}): Promise<void> {
  const { nonce: _nonce, message } = await api.authNonce(opts.address);
  void _nonce; // contained inside `message` for verification
  const signature = await opts.walletClient.signMessage({ account: opts.address, message });
  try {
    await api.authVerify(message, signature);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      throw new Error("Signature rejected. Please try again.");
    }
    throw e;
  }
}
