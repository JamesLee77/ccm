import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Citation = {
  source: string;
  year: string;
  claim: string;
  topic: string;
};

const CITATIONS: Citation[] = [
  {
    source: "Berkeley · West et al.",
    year: "2024",
    claim: "≈40% of REDD+ projects studied carried inflated baselines, overstating their climate benefit.",
    topic: "Opacity",
  },
  {
    source: "Verra registry",
    year: "Nov 2022",
    claim: "Banned onchain bridging of VCS credits, freezing the Toucan BCT pool indefinitely.",
    topic: "Bridge risk",
  },
  {
    source: "ICVCM CCP",
    year: "2023",
    claim: "Issued the first integrity threshold for voluntary credits — ~70% of legacy issuances missed it.",
    topic: "No grading",
  },
  {
    source: "World Bank",
    year: "2024",
    claim: "Same-grade nature credits trade $4–$80 in the same quarter, depending on broker discretion.",
    topic: "Illiquidity",
  },
  {
    source: "Anders et al. · Nature",
    year: "2024",
    claim: "Onchain carbon needs originating issuance, not retro-tokenization, to escape registry capture.",
    topic: "Tokenize-only",
  },
];

export default function MarketEvidence() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const [shown, setShown] = useState(reduced);

  useEffect(() => {
    if (reduced) return setShown(true);
    const root = ref.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
            return;
          }
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(root);
    return () => obs.disconnect();
  }, [reduced]);

  return (
    <ol
      ref={ref}
      className="border border-rule"
      style={{
        background: "var(--paper-deep)",
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      <li
        className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
        style={{
          gridTemplateColumns: "200px 80px 1fr 120px",
          gap: 16,
          padding: "16px 24px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <span>source</span>
        <span>year</span>
        <span>claim</span>
        <span className="text-moss">topic</span>
      </li>
      {CITATIONS.map((c, i) => (
        <li
          key={c.source}
          className="grid items-baseline"
          style={{
            gridTemplateColumns: "200px 80px 1fr 120px",
            gap: 16,
            padding: "18px 24px",
            borderBottom: i < CITATIONS.length - 1 ? "1px solid var(--rule)" : "none",
            opacity: shown ? 1 : 0,
            transform: shown ? "translateY(0)" : "translateY(6px)",
            transition: reduced
              ? "none"
              : `opacity 320ms ease-out ${i * 80}ms, transform 320ms ease-out ${i * 80}ms`,
          }}
        >
          <span className="font-mono text-ink" style={{ fontSize: 12 }}>
            {c.source}
          </span>
          <span className="font-mono text-ink-soft" style={{ fontSize: 12 }}>
            {c.year}
          </span>
          <span
            className="font-body text-ink"
            style={{ fontSize: 13, lineHeight: 1.55 }}
          >
            {c.claim}
          </span>
          <span className="font-mono text-moss" style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
            {c.topic}
          </span>
        </li>
      ))}
    </ol>
  );
}
