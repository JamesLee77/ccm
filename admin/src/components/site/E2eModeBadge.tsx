import { useAccount } from "wagmi";
import { Link } from "react-router-dom";
import { TEST_CONNECTOR_ID } from "../../e2e/testConnector";
import { IS_MAINNET } from "../../lib/env";

/**
 * When the active wagmi connector is the local-key test wallet, show a
 * conspicuous clay badge so the operator (or a screenshot reviewer)
 * notices they're not on a real wallet. Mainnet builds never render this
 * badge — the route + connector that produce it are excluded.
 */
export default function E2eModeBadge() {
  const { connector, address } = useAccount();
  if (IS_MAINNET) return null;
  if (connector?.id !== TEST_CONNECTOR_ID) return null;
  return (
    <Link
      to="/e2e"
      className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border hover:opacity-80"
      style={{
        background: "var(--clay)",
        color: "var(--paper)",
        borderColor: "var(--clay)",
      }}
      title={`E2E test wallet active · ${address ?? "(no account)"} · click to manage`}
    >
      🧪 E2E
      {address && (
        <span style={{ marginLeft: 6, opacity: 0.85, textTransform: "none" }}>
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      )}
    </Link>
  );
}
