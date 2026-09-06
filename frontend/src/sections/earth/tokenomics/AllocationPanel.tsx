import { useState } from "react";
import AllocationRing, { ALLOCATION } from "./AllocationRing";

type TableProps = {
  active: string | null;
  onActive: (id: string | null) => void;
};

/**
 * Allocation table, hover-synced with the ring. Desktop rows + mobile
 * stacked cards.
 */
export function AllocationTable({ active, onActive }: TableProps) {
  return (
    <>
      {/* Desktop: full table */}
      <div
        className="border border-rule hidden md:block"
        style={{ background: "var(--panel, var(--paper-deep))" }}
        onMouseLeave={() => onActive(null)}
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
                borderBottom: i < ALLOCATION.length - 1 ? "1px solid var(--rule)" : "none",
                background: isActive ? "var(--paper)" : "transparent",
                cursor: "pointer",
              }}
              onMouseEnter={() => onActive(row.id)}
              onFocus={() => onActive(row.id)}
              tabIndex={0}
            >
              <span
                aria-hidden
                style={{ width: 12, height: 12, background: row.color, display: "inline-block" }}
              />
              <div className="font-display text-ink" style={{ fontSize: 18, fontWeight: 500 }}>
                {row.label}
              </div>
              <div className="font-mono text-moss" style={{ fontSize: 14 }}>
                {row.pct}%
              </div>
              <div className="font-mono text-ink" style={{ fontSize: 14 }}>
                {row.tokens}
              </div>
              <div className="font-body text-ink-soft" style={{ fontSize: 14 }}>
                {row.note}
              </div>
            </div>
          );
        })}
      </div>
      {/* Mobile: stacked allocation cards */}
      <div
        className="md:hidden border border-rule"
        style={{ background: "var(--panel, var(--paper-deep))" }}
      >
        {ALLOCATION.map((row, i) => (
          <div
            key={row.id}
            style={{
              padding: "18px 20px",
              borderBottom: i < ALLOCATION.length - 1 ? "1px solid var(--rule)" : "none",
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
              <div className="font-display text-ink" style={{ fontSize: 17, fontWeight: 500 }}>
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
    </>
  );
}

/**
 * Ring + table with shared hover state — the home §06 signature visual.
 */
export default function AllocationPanel() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="grid items-start gap-8 grid-cols-1 md:grid-cols-[auto_1fr] md:gap-12">
      <div className="flex justify-center md:justify-start">
        <AllocationRing active={active} onHover={setActive} />
      </div>
      <AllocationTable active={active} onActive={setActive} />
    </div>
  );
}
