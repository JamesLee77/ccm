import { useTranslation } from "react-i18next";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TESTNET_CHAIN_ID } from "../../lib/wagmi";

export default function WalletStatusBar() {
  const { t } = useTranslation();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const wrongChain = isConnected && chainId !== TESTNET_CHAIN_ID;

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 10,
      background: "var(--paper)", borderBottom: "1px solid var(--rule)",
      padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
        {!isConnected
          ? t("wallet.connect")
          : wrongChain
            ? t("wallet.wrongChain")
            : `${t("wallet.connected")} · ${address?.slice(0,6)}…${address?.slice(-4)}`}
      </div>
      <div>
        {wrongChain ? (
          <button
            onClick={() => switchChain({ chainId: TESTNET_CHAIN_ID })}
            style={{
              background: "var(--moss)", color: "var(--paper)", border: 0,
              padding: "6px 14px", cursor: "pointer", fontSize: 12,
              letterSpacing: "0.14em", textTransform: "uppercase",
            }}
          >
            {t("wallet.wrongChain")}
          </button>
        ) : (
          <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
        )}
      </div>
    </div>
  );
}
