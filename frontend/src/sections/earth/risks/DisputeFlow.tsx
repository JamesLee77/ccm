import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Step = {
  id: string;
  num: string;
  label: string;
  body: string;
  icon: React.ReactNode;
};

const STEPS: Step[] = [
  {
    id: "raise",
    num: "01",
    label: "Raise",
    body: "Anyone can dispute a CCM-NFT; provide evidence and the disputed tokenId.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4v16M9 11l7-7 7 7" />
      </g>
    ),
  },
  {
    id: "bond",
    num: "02",
    label: "Bond",
    body: "Proposer locks $CCM. Bond is forfeit if dispute is dismissed.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x={8} y={14} width={16} height={12} rx={1} />
        <path d="M11 14V9a5 5 0 0 1 10 0v5" />
      </g>
    ),
  },
  {
    id: "panel",
    num: "03",
    label: "Panel review",
    body: "Five randomly-selected VVBs review evidence within 14 days.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={11} cy={12} r={3} />
        <circle cx={21} cy={12} r={3} />
        <circle cx={16} cy={20} r={3} />
        <path d="M14 14l1.5 4M18 14l-1.5 4M11 15l5 5M21 15l-5 5" />
      </g>
    ),
  },
  {
    id: "resolution",
    num: "04",
    label: "Resolution",
    body: "Vote upheld → NFT burns + slashes guilty VVBs. Dismissed → bond goes to vault.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4l9 5v7c0 5-4 9-9 11-5-2-9-6-9-11V9z" />
        <path d="M12 16l3 3 6-6" />
      </g>
    ),
  },
  {
    id: "remedy",
    num: "05",
    label: "Remedy",
    body: "Holders of invalidated NFTs reimbursed from CCMInsurance Vault.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 28c5-3 9-7 9-13V8L16 5 7 8v7c0 6 4 10 9 13z" />
        <path d="M12 14h8M12 18h6" />
      </g>
    ),
  },
];

export default function DisputeFlow() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const [visible, setVisible] = useState<number>(reduced ? STEPS.length : 0);

  useEffect(() => {
    if (reduced) return;
    const root = ref.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            STEPS.forEach((_, i) => {
              window.setTimeout(() => setVisible((v) => Math.max(v, i + 1)), i * 140);
            });
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-5">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          dispute pipeline · five steps
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          14-day SLA · onchain bond
        </div>
      </div>
      <ol
        ref={ref}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
          listStyle: "none",
          padding: 0,
          margin: 0,
        }}
      >
        {STEPS.map((step, i) => {
          const shown = i < visible;
          const isLast = i === STEPS.length - 1;
          return (
            <li
              key={step.id}
              className="relative border border-rule"
              style={{
                padding: "28px 24px",
                background: "var(--paper-deep)",
                borderRight: isLast ? "1px solid var(--rule)" : "none",
                opacity: shown ? 1 : 0,
                transform: shown ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 360ms ease-out, transform 360ms ease-out",
              }}
            >
              {!isLast ? (
                <div
                  aria-hidden
                  className="absolute font-mono text-moss"
                  style={{
                    right: -8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 16,
                    background: "var(--paper)",
                    padding: "0 4px",
                    zIndex: 1,
                    opacity: shown ? 1 : 0,
                    transition: "opacity 240ms ease-out 200ms",
                  }}
                >
                  →
                </div>
              ) : null}
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss">
                {step.num}
              </div>
              <div className="text-ink mt-3" style={{ width: 28, height: 28 }}>
                <svg viewBox="0 0 32 32" width="28" height="28">
                  {step.icon}
                </svg>
              </div>
              <div
                className="font-display text-ink mt-3"
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "-0.015em",
                }}
              >
                {step.label}
              </div>
              <div
                className="font-body text-ink-soft mt-2"
                style={{ fontSize: 13, lineHeight: 1.55 }}
              >
                {step.body}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
