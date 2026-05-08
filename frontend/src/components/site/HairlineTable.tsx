import type { ReactNode } from "react";

type Col = {
  label: ReactNode;
  /** Tailwind grid column template fragment, e.g. "1fr", "120px". */
  width?: string;
  align?: "left" | "right";
};

type Row = {
  /** Cell contents. Length must match cols. */
  cells: ReactNode[];
  key?: string;
};

type Props = {
  cols: Col[];
  rows: Row[];
  /** Optional surface — default uses paperDeep ; pass false to use transparent. */
  surface?: boolean;
};

/**
 * Hairline table — single-pixel rule between rows, no fills, sharp edges.
 * Matches the visual language from Grades / RiskRegister / etc.
 */
export default function HairlineTable({ cols, rows, surface = true }: Props) {
  const gridTemplate = cols.map((c) => c.width ?? "1fr").join(" ");
  return (
    <div
      className={`border border-rule ${surface ? "" : ""}`}
      style={{
        background: surface ? "var(--paper-deep)" : "transparent",
      }}
    >
      <div
        className="grid font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
        style={{
          gridTemplateColumns: gridTemplate,
          padding: "16px 24px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        {cols.map((c, i) => (
          <div
            key={i}
            className={c.align === "right" ? "text-right" : ""}
          >
            {c.label}
          </div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div
          key={row.key ?? ri}
          className="grid items-center hover:bg-paper transition-colors"
          style={{
            gridTemplateColumns: gridTemplate,
            padding: "20px 24px",
            borderBottom:
              ri < rows.length - 1 ? "1px solid var(--rule)" : "none",
          }}
        >
          {row.cells.map((cell, ci) => (
            <div
              key={ci}
              className={cols[ci]?.align === "right" ? "text-right" : ""}
            >
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
