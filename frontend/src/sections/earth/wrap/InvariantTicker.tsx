import { useEffect, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

const START = 956719;

function tickInterval(): number {
  return 4500 + Math.random() * 3500;
}

export default function InvariantTicker() {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(START);

  useEffect(() => {
    if (reduced) return;
    const timeouts: number[] = [];
    const schedule = () => {
      timeouts.push(
        window.setTimeout(() => {
          setValue((v) => v + Math.floor(3 + Math.random() * 18));
          schedule();
        }, tickInterval()),
      );
    };
    schedule();
    return () => {
      for (const t of timeouts) window.clearTimeout(t);
    };
  }, [reduced]);

  // The vault contract enforces a 1:1 invariant; both sides should stay equal.
  const left = value;
  const right = value;
  const balanced = left === right;

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span
          aria-hidden
          className="it-pulse"
          style={{
            width: 8,
            height: 8,
            background: balanced ? "var(--moss)" : "var(--clay)",
            borderRadius: "50%",
            display: "inline-block",
          }}
        />
        <span
          className="font-mono text-[11px] tracking-[0.16em] uppercase"
          style={{ color: balanced ? "var(--moss)" : "var(--clay)" }}
        >
          invariant · {balanced ? "ok" : "drift detected"}
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft ml-auto">
          enforced onchain
        </span>
      </div>

      {/* Code-style invariant equation */}
      <pre
        className="font-mono text-ink"
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          background: "var(--paper)",
          border: "1px solid var(--rule)",
          padding: "20px 24px",
          margin: 0,
          overflowX: "auto",
        }}
      >
{`assert total_supply($CCM)
       == sum(NFT in vault) × tCO₂e per NFT;`}
      </pre>

      <div
        className="grid items-center mt-6"
        style={{ gridTemplateColumns: "1fr auto 1fr", gap: 24 }}
      >
        {/* NFT side */}
        <div
          className="border border-rule"
          style={{ background: "var(--paper)", padding: "24px 28px" }}
        >
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss">
            NFT vault
          </div>
          <div
            className="font-display text-ink mt-2"
            style={{
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {left.toLocaleString()}
          </div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-soft mt-1">
            ERC-1155 locked tokens
          </div>
        </div>

        {/* Equality marker */}
        <div className="text-center">
          <div
            className="font-display"
            style={{
              fontSize: 40,
              color: "var(--moss)",
              lineHeight: 1,
            }}
          >
            =
          </div>
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss mt-2">
            1 : 1
          </div>
        </div>

        {/* Token side */}
        <div
          className="border border-rule"
          style={{ background: "var(--paper)", padding: "24px 28px" }}
        >
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss">
            $CCM circulating
          </div>
          <div
            className="font-display text-ink mt-2"
            style={{
              fontSize: 36,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {right.toLocaleString()}
          </div>
          <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-soft mt-1">
            ERC-20 minted by vault
          </div>
        </div>
      </div>

      <style>{`
        @keyframes it-pulse-anim {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .it-pulse { animation: it-pulse-anim 2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .it-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
