import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Layer = {
  id: string;
  label: string;
  body: string;
  /** 0..1, controls bar width */
  strength: number;
  color: string;
};

// Outer-to-inner: each row stacks under the previous, narrower bar = deeper.
const LAYERS: Layer[] = [
  {
    id: "stake",
    label: "Stake bond",
    body: "Each VVB and CCMiner posts $CCM to qualify. Skin in the game from day zero.",
    strength: 1.0,
    color: "var(--moss)",
  },
  {
    id: "consensus",
    label: "M-of-N consensus",
    body: "Higher-grade credits require more independent signatures (CCM-A: 5-of-7, CCM-D: 3-of-5).",
    strength: 0.9,
    color: "var(--moss-2)",
  },
  {
    id: "slash",
    label: "Slashing",
    body: "Wrong attestations confiscate stake automatically — no foundation discretion involved.",
    strength: 0.78,
    color: "var(--sky)",
  },
  {
    id: "zk",
    label: "ZK-proof option",
    body: "Sensitive datasets can be verified without exposing raw measurements onchain.",
    strength: 0.62,
    color: "#7ba9c4",
  },
  {
    id: "dispute",
    label: "Dispute layer",
    body: "Anyone can challenge a credit; bonded panel reviews; invalid NFTs burn.",
    strength: 0.46,
    color: "var(--clay)",
  },
  {
    id: "insurance",
    label: "Insurance Vault",
    body: "Holders of disputed credits are reimbursed from the protocol-funded insurance pool.",
    strength: 0.32,
    color: "#e88a4e",
  },
];

export default function DefenseInDepth() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const root = ref.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          defense in depth · verification
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          {LAYERS.length} layers · outer → inner
        </div>
      </div>
      <p
        className="font-body text-ink-soft mt-2 mb-8"
        style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 720 }}
      >
        A bad attestation has to defeat every layer below to land. Stake bond,
        then consensus, then slashing — and if all three fail, the dispute
        layer and the insurance vault remain.
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {LAYERS.map((layer, i) => {
          const widthPct = layer.strength * 100;
          const delay = i * 110;
          return (
            <div
              key={layer.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: "180px 1fr",
                gap: 24,
              }}
            >
              <div>
                <div
                  className="font-display text-ink"
                  style={{ fontSize: 16, fontWeight: 500 }}
                >
                  {layer.label}
                </div>
                <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-soft mt-1">
                  layer {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              <div>
                <div
                  className="overflow-hidden border border-rule"
                  style={{
                    height: 22,
                    background: "var(--paper)",
                  }}
                >
                  <div
                    style={{
                      width: shown ? `${widthPct}%` : "0%",
                      height: "100%",
                      background: layer.color,
                      transition: reduced
                        ? "none"
                        : `width 1100ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
                    }}
                  />
                </div>
                <div
                  className="font-body text-ink-soft mt-2"
                  style={{ fontSize: 13, lineHeight: 1.5 }}
                >
                  {layer.body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
