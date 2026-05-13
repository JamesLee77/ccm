import { useTranslation } from "react-i18next";
import { SANDBOX, EXPLORER } from "../../lib/contracts";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer style={{
      borderTop: "1px solid var(--rule)",
      padding: "32px 24px",
      color: "var(--ink-soft)",
      fontSize: 12,
      background: "var(--paper-deep)",
    }}>
      <div style={{ marginBottom: 16, fontWeight: 600, color: "var(--ink)" }}>
        {t("footer.contracts")}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: 1.9 }}>
        <li>CCM Token (sandbox): <a href={`${EXPLORER}/address/${SANDBOX.ccmToken}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.ccmToken}</a></li>
        <li>CCMSandboxNFT: <a href={`${EXPLORER}/address/${SANDBOX.ccmSandboxNFT}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.ccmSandboxNFT}</a></li>
        <li>CCMSandboxVault: <a href={`${EXPLORER}/address/${SANDBOX.ccmSandboxVault}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.ccmSandboxVault}</a></li>
        <li>CCMSandboxStaking: <a href={`${EXPLORER}/address/${SANDBOX.ccmSandboxStaking}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.ccmSandboxStaking}</a></li>
        <li>Oracle-A: <a href={`${EXPLORER}/address/${SANDBOX.oracleA}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.oracleA}</a></li>
        <li>Oracle-B: <a href={`${EXPLORER}/address/${SANDBOX.oracleB}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.oracleB}</a></li>
        <li>Oracle-C: <a href={`${EXPLORER}/address/${SANDBOX.oracleC}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.oracleC}</a></li>
        <li>MedianAggregator: <a href={`${EXPLORER}/address/${SANDBOX.medianAggregator}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.medianAggregator}</a></li>
        <li>NodeRegistry: <a href={`${EXPLORER}/address/${SANDBOX.nodeRegistry}`} target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{SANDBOX.nodeRegistry}</a></li>
      </ul>
      <div style={{ marginTop: 24, display: "flex", gap: 20 }}>
        <a href="https://portal.ccmnetwork.net" target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{t("footer.mainnet")}</a>
        <a href="https://github.com/JamesLee77/ccm" target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>{t("footer.github")}</a>
      </div>
    </footer>
  );
}
