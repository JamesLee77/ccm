import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Step = {
  id: string;
  num: string;
  label: string;
  body: string;
  /** Inline pictogram drawn into a 24×24 viewBox. */
  icon: React.ReactNode;
};

const STEPS: Step[] = [
  {
    id: "activity",
    num: "01",
    label: "Activity",
    body: "DAC, mineralization, biochar, afforestation operate onchain.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </g>
    ),
  },
  {
    id: "oracle",
    num: "02",
    label: "Oracle",
    body: "Sentinel-2, Planet Labs, IoT, LiDAR feed signed measurements.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
      </g>
    ),
  },
  {
    id: "vvb",
    num: "03",
    label: "VVB",
    body: "Stake-bonded validators reach M-of-N consensus, assign grade.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3l8 4v5c0 5-4 8-8 9-4-1-8-4-8-9V7z" />
        <path d="M9 12l2 2 4-4" />
      </g>
    ),
  },
  {
    id: "mint",
    num: "04",
    label: "Mint",
    body: "ERC-1155 NFT issued; vintage, grade, project, signatures baked in.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="16" height="16" />
        <path d="M4 9h16M9 4v16" />
      </g>
    ),
  },
  {
    id: "activate",
    num: "05",
    label: "Activate",
    body: "Hold, retire, or wrap to $CCM for AMM, lending, indices.",
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12h13M11 6l6 6-6 6" />
        <path d="M21 12h-1" />
      </g>
    ),
  },
];

export default function IssuanceFlow() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState<number>(reduced ? STEPS.length : 0);
  const containerRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (reduced) return;
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Stagger reveal — one step every 140ms once container enters viewport.
            STEPS.forEach((_, i) => {
              window.setTimeout(() => setVisible((v) => Math.max(v, i + 1)), i * 140);
            });
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <ol
      ref={containerRef}
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
        gap: 0,
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
            {/* connector arrow to next step */}
            {!isLast ? (
              <div
                aria-hidden="true"
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
            <div
              className="text-ink mt-3"
              style={{ width: 24, height: 24 }}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                {step.icon}
              </svg>
            </div>
            <div
              className="font-display text-ink mt-3"
              style={{
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "-0.015em",
              }}
            >
              {step.label}
            </div>
            <div
              className="font-body text-ink-soft mt-2"
              style={{ fontSize: 13, lineHeight: 1.5 }}
            >
              {step.body}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
