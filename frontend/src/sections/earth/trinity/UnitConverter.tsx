import { useState } from "react";

type Unit = {
  id: string;
  symbol: string;
  factor: number; // grams of CO₂e
  example: string;
};

const UNITS: Unit[] = [
  { id: "u", symbol: "μCCM", factor: 1, example: "1 g CO₂e — 0.5 km in a sedan" },
  { id: "m", symbol: "mCCM", factor: 1_000, example: "1 kg — short flight beverage cart impact" },
  { id: "ccm", symbol: "CCM", factor: 1_000_000, example: "1 t — average household for ~3 weeks" },
  { id: "k", symbol: "kCCM", factor: 1_000_000_000, example: "1,000 t — DAC pilot annual output" },
  { id: "M", symbol: "MCCM", factor: 1_000_000_000_000, example: "1M t — mid-size fund offset budget" },
  { id: "G", symbol: "GCCM", factor: 1_000_000_000_000_000, example: "1B t — Korea 2030 NDC ≈ 290 MCCM" },
];

export default function UnitConverter() {
  const [amount, setAmount] = useState(1);
  const [unitId, setUnitId] = useState<string>("ccm");

  const unit = UNITS.find((u) => u.id === unitId)!;
  const grams = amount * unit.factor;

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="flex items-baseline justify-between mb-5">
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
          unit converter · SI prefixes
        </div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft">
          μ → m → CCM → k → M → G
        </div>
      </div>

      <div
        className="grid items-end mb-6"
        style={{ gridTemplateColumns: "1fr auto 1fr", gap: 32 }}
      >
        <div>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-2">
            amount
          </div>
          <input
            type="number"
            value={amount}
            min={0}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            className="font-display text-ink bg-paper border border-rule px-4 py-3 w-full"
            style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}
          />
        </div>
        <div className="text-center font-display text-moss" style={{ fontSize: 32, lineHeight: 1, paddingBottom: 14 }}>
          ×
        </div>
        <div>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-2">
            unit
          </div>
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="font-display text-ink bg-paper border border-rule px-4 py-3 w-full"
            style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em" }}
          >
            {UNITS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="border border-rule p-5"
        style={{ background: "var(--paper)" }}
      >
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-2">
          equivalent
        </div>
        <div
          className="font-display text-ink"
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.015em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {grams.toLocaleString()} g CO₂e
        </div>
        <div
          className="font-body text-ink-soft mt-3"
          style={{ fontSize: 14, lineHeight: 1.5 }}
        >
          {unit.example}
        </div>
      </div>

      <div
        className="grid mt-5"
        style={{ gridTemplateColumns: "repeat(6, 1fr)", gap: 1, background: "var(--rule)" }}
      >
        {UNITS.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setUnitId(u.id)}
            className="font-mono text-[10px] tracking-[0.14em] uppercase border-0"
            style={{
              background: u.id === unitId ? "var(--moss)" : "var(--paper)",
              color: u.id === unitId ? "var(--paper)" : "var(--ink-soft)",
              padding: "12px 8px",
              cursor: "pointer",
            }}
          >
            {u.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}
