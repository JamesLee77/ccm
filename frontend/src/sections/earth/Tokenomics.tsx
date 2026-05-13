import { useState } from "react";
import { useTranslation } from "react-i18next";
import Section from "../../components/site/Section";
import SectionLabel from "../../components/site/SectionLabel";
import Heading from "../../components/site/Heading";
import AllocationRing, { ALLOCATION } from "./tokenomics/AllocationRing";
import EmissionCurve from "./tokenomics/EmissionCurve";
import VestingTimeline from "./tokenomics/VestingTimeline";
import UtilityCards from "./tokenomics/UtilityCards";
import ValueAccrualLive from "./tokenomics/ValueAccrualLive";

export default function Tokenomics() {
  const { t } = useTranslation("earth");
  const [active, setActive] = useState<string | null>(null);

  return (
    <Section id="tokenomics">
      <SectionLabel>{t("tokenomics.label")}</SectionLabel>

      {/* Hero — heading/lead + animated allocation ring */}
      <div
        className="grid items-center mt-8 mb-12 grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr] md:gap-16"
      >
        <div>
          <Heading
            pre={t("tokenomics.h1Pre")}
            em={t("tokenomics.h1Em")}
            maxWidth={720}
          />
          <p
            className="font-body text-ink-soft mt-10"
            style={{ fontSize: 19, lineHeight: 1.5, maxWidth: 640 }}
          >
            {t("tokenomics.lead")}
          </p>
        </div>
        <div className="flex justify-center md:justify-end">
          <AllocationRing active={active} onHover={setActive} />
        </div>
      </div>

      {/* Allocation table — synced with the ring above */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.allocationLabel")}
      </div>
      {/* Desktop: full table */}
      <div
        className="border border-rule hidden md:block"
        style={{ background: "var(--paper-deep)" }}
        onMouseLeave={() => setActive(null)}
      >
        <div
          className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
          style={{
            gridTemplateColumns: "20px 1.6fr 0.5fr 0.6fr 1.4fr",
            gap: 16,
            padding: "16px 24px",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <div />
          <div>Category</div>
          <div>%</div>
          <div>Tokens</div>
          <div>Notes</div>
        </div>
        {ALLOCATION.map((row, i) => {
          const isActive = active === row.id;
          return (
            <div
              key={row.id}
              className="grid items-center transition-colors"
              style={{
                gridTemplateColumns: "20px 1.6fr 0.5fr 0.6fr 1.4fr",
                gap: 16,
                padding: "20px 24px",
                borderBottom:
                  i < ALLOCATION.length - 1
                    ? "1px solid var(--rule)"
                    : "none",
                background: isActive ? "var(--paper)" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={() => setActive(row.id)}
              onFocus={() => setActive(row.id)}
              tabIndex={0}
            >
              <span
                aria-hidden
                style={{
                  width: 12,
                  height: 12,
                  background: row.color,
                  display: "inline-block",
                }}
              />
              <div
                className="font-display text-ink"
                style={{ fontSize: 18, fontWeight: 500 }}
              >
                {row.label}
              </div>
              <div className="font-mono text-moss" style={{ fontSize: 14 }}>
                {row.pct}%
              </div>
              <div className="font-mono text-ink" style={{ fontSize: 14 }}>
                {row.tokens}
              </div>
              <div
                className="font-body text-ink-soft"
                style={{ fontSize: 14 }}
              >
                {row.note}
              </div>
            </div>
          );
        })}
      </div>
      {/* Mobile: stacked allocation cards */}
      <div
        className="md:hidden border border-rule"
        style={{ background: "var(--paper-deep)" }}
      >
        {ALLOCATION.map((row, i) => (
          <div
            key={row.id}
            style={{
              padding: "18px 20px",
              borderBottom:
                i < ALLOCATION.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span
                aria-hidden
                style={{
                  width: 12,
                  height: 12,
                  background: row.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <div
                className="font-display text-ink"
                style={{ fontSize: 17, fontWeight: 500 }}
              >
                {row.label}
              </div>
              <div className="ml-auto font-mono text-moss" style={{ fontSize: 14 }}>
                {row.pct}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-moss mb-0.5">
                  Tokens
                </div>
                <div className="font-mono text-ink" style={{ fontSize: 13 }}>
                  {row.tokens}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-moss mb-0.5">
                  Notes
                </div>
                <div className="font-body text-ink-soft" style={{ fontSize: 13, lineHeight: 1.45 }}>
                  {row.note}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Emission curve */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.emissionLabel")}
      </div>
      <EmissionCurve />

      {/* Vesting timeline */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.vestingLabel")}
      </div>
      <VestingTimeline />

      {/* Utility cards */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.utilityLabel")}
      </div>
      <UtilityCards />

      {/* Value accrual + live burn */}
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5 mt-16">
        {t("tokenomics.accrualLabel")}
      </div>
      <ValueAccrualLive />
    </Section>
  );
}
