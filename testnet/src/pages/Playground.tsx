import { useTranslation } from "react-i18next";
import TestnetLayout from "../components/site/TestnetLayout";
import WalletStatusBar from "../components/wallet/WalletStatusBar";
import StepCard from "../components/playground/StepCard";

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
        (MintForm + Inventory arrive in Task 7.)
      </StepCard>
      <StepCard step={2} title={t("step2.title")} subtitle={t("step2.subtitle")}>
        (WrapForm arrives in Task 8.)
      </StepCard>
      <StepCard step={3} title={t("step3.title")} subtitle={t("step3.subtitle")}>
        (StakeForm arrives in Task 9.)
      </StepCard>
      <StepCard step={4} title={t("step4.title")} subtitle={t("step4.subtitle")}>
        (RewardPanel arrives in Task 10.)
      </StepCard>
    </TestnetLayout>
  );
}
