import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";
import WalletStatusBar from "../components/wallet/WalletStatusBar";
import StepCard from "../components/playground/StepCard";
import MintForm from "../components/playground/MintForm";
import NFTInventory from "../components/playground/NFTInventory";
import WrapForm from "../components/playground/WrapForm";
import StakeForm from "../components/playground/StakeForm";
import RewardPanel from "../components/playground/RewardPanel";
import SwapForm from "../components/playground/SwapForm";
import TryMoreGrid from "../components/playground/TryMoreGrid";
import NodeRegistrationCallout from "../components/playground/NodeRegistrationCallout";
import HeroBanner from "../components/marketing/HeroBanner";
import LiveNetworkState from "../components/marketing/LiveNetworkState";
import MiningNetworkViz from "../components/marketing/MiningNetworkViz";
import MiningTimeline from "../components/marketing/MiningTimeline";
import OracleConsensusPanel from "../components/marketing/OracleConsensusPanel";
import YieldCurvePanel from "../components/marketing/YieldCurvePanel";
import ActivityFeed from "../components/marketing/ActivityFeed";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <TestnetLayout>
      <HeroBanner />
      <LiveNetworkState />
      <MiningNetworkViz />
      <MiningTimeline />
      <OracleConsensusPanel />
      <YieldCurvePanel />
      <ActivityFeed />
      <NodeRegistrationCallout />

      <WalletStatusBar />
      <section style={{
        border: "1px solid var(--rule)",
        background: "var(--paper-deep)",
        padding: 20,
        marginBottom: 32,
        marginTop: 32,
      }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
          color: "var(--ink-soft)", marginBottom: 12,
        }}>
          {t("needs.title")}
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--ink)" }}>
          <li>· {t("needs.wallet")}</li>
          <li>· {t("needs.network")}</li>
          <li>
            · {t("needs.gas")}{" "}
            <a href="https://portal.cdp.coinbase.com/products/faucet" target="_blank" rel="noreferrer" style={{ color: "var(--moss)" }}>
              {t("needs.faucet")}
            </a>
            .
          </li>
          <li>· {t("needs.time")}</li>
        </ul>
      </section>

      <StepCard step={1} title={t("step1.title")} subtitle={t("step1.subtitle")}>
        <MintForm />
        <NFTInventory />
      </StepCard>
      <StepCard step={2} title={t("step2.title")} subtitle={t("step2.subtitle")}>
        <WrapForm />
      </StepCard>
      <StepCard step={3} title={t("step3.title")} subtitle={t("step3.subtitle")}>
        <StakeForm />
      </StepCard>
      <StepCard step={4} title={t("step4.title")} subtitle={t("step4.subtitle")}>
        <RewardPanel />
      </StepCard>
      <StepCard step={5} title={t("step5.title")} subtitle={t("step5.subtitle")}>
        <SwapForm />
      </StepCard>
      <TryMoreGrid />
    </TestnetLayout>
  );
}
