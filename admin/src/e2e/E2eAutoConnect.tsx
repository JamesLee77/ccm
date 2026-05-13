import { useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { TEST_CONNECTOR_ID } from "./testConnector";
import { IS_MAINNET } from "../lib/env";

/**
 * When the test connector is the only one in the wagmi config (because a
 * key was saved via /e2e), automatically connect on mount. Removes the
 * "click Connect Wallet" step for browser automation.
 *
 * Renders nothing.
 */
export default function E2eAutoConnect() {
  const { status, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    if (IS_MAINNET) return;
    if (isConnected || status === "connecting" || status === "reconnecting") return;
    const test = connectors.find((c) => c.id === TEST_CONNECTOR_ID);
    if (!test) return;
    connect({ connector: test });
  }, [isConnected, status, connectors, connect]);

  return null;
}
