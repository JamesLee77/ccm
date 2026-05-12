import { useCallback, useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import type { Address } from "viem";
import { api, ApiError, type MeResponse } from "../lib/api";
import { signInWithEthereum } from "../lib/siwe";

export function useSession() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const m = await api.me();
      setMe(m);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setMe(null);
      else throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh, address]);

  const signIn = useCallback(async () => {
    if (!address || !walletClient) return;
    setSigning(true);
    setError(null);
    try {
      await signInWithEthereum({ walletClient, address: address as Address });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setSigning(false);
    }
  }, [address, walletClient, refresh]);

  const signOut = useCallback(async () => {
    await api.authLogout();
    setMe(null);
  }, []);

  return { isConnected, address, me, loading, signing, error, signIn, signOut, refresh };
}
