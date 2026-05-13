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
        <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 16, maxWidth: 720, lineHeight: 1.55 }}>
          {t("hero.lead")}
        </p>
      </section>

      <section style={{
        border: "1px solid var(--rule)",
        background: "var(--paper-deep)",
        padding: 20,
        marginBottom: 32,
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
            <a
              href="https://portal.cdp.coinbase.com/products/faucet"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--moss)" }}
            >
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
      <TryMoreGrid />
    </TestnetLayout>
  );
}
