import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";
import WalletStatusBar from "../components/wallet/WalletStatusBar";
import StepCard from "../components/playground/StepCard";
import MintForm from "../components/playground/MintForm";
import NFTInventory from "../components/playground/NFTInventory";
import WrapForm from "../components/playground/WrapForm";
import StakeForm from "../components/playground/StakeForm";
import RewardPanel from "../components/playground/RewardPanel";
import TryMoreGrid from "../components/playground/TryMoreGrid";

export default function Playground() {
  const { t } = useTranslation();
  return (
    <TestnetLayout>
      <WalletStatusBar />
      <section style={{ marginTop: 32, marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, lineHeight: 1.05, margin: 0 }}>{t("hero.headline")}</h1>
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 16 }}>{t("hero.tagline")}</p>
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
      <TryMoreGrid />
    </TestnetLayout>
  );
}
