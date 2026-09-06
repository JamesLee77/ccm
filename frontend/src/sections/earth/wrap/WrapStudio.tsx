import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Wrap Studio — the NFT ⇄ $CCM slider demo. Owns its own amount state.
 * Shared by the home §04 chapter and the full Wrap section on /protocol.
 */
export default function WrapStudio() {
  const { t } = useTranslation("earth");
  const [amt, setAmt] = useState(100);
  return (
    <>
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-5">
        {t("wrap.studioLabel")}
      </div>
      <div
        className="border border-rule"
        style={{ background: "var(--panel, var(--paper-deep))", padding: 48 }}
      >
        <div className="grid items-center mb-10 grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          {/* NFT side */}
          <div
            className="border border-rule"
            style={{ background: "var(--paper)", padding: 24 }}
          >
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
              {t("wrap.nft")}
            </div>
            <div
              className="font-display text-ink mt-3"
              style={{ fontSize: 64, fontWeight: 300, letterSpacing: "-0.03em" }}
            >
              {amt.toLocaleString()}
            </div>
            <div
              className="font-mono text-ink-soft mt-4"
              style={{ fontSize: 11, lineHeight: 1.7 }}
            >
              {t("wrap.nftMeta")}
            </div>
          </div>

          {/* Wrap arrow */}
          <div
            className="text-center font-mono text-moss"
            style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            <div className="text-ink" style={{ fontSize: 28, lineHeight: 1 }}>
              ⇄
            </div>
            <div className="mt-2.5">{t("wrap.wrapLabel")}</div>
            <div className="mt-1">{t("wrap.ratio")}</div>
          </div>

          {/* Token side */}
          <div
            className="border border-rule"
            style={{ background: "var(--ink)", color: "var(--paper)", padding: 24 }}
          >
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
              {t("wrap.token")}
            </div>
            <div
              className="font-display mt-3"
              style={{
                fontSize: 64,
                fontWeight: 300,
                letterSpacing: "-0.03em",
                color: "var(--paper)",
              }}
            >
              {amt.toLocaleString()}
            </div>
            <div
              className="font-mono mt-4"
              style={{ fontSize: 11, lineHeight: 1.7, color: "#bcbeb6" }}
            >
              {t("wrap.tokenMeta")}
            </div>
          </div>
        </div>

        {/* Slider */}
        <div>
          <div className="flex justify-between font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft mb-3">
            <span>{t("wrap.drag")}</span>
            <span>{t("wrap.amount", { amt })}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10000}
            value={amt}
            onChange={(e) => setAmt(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--moss)" }}
            aria-label={t("wrap.drag")}
          />
        </div>
      </div>
    </>
  );
}
