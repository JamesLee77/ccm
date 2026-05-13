import type { ReactNode } from "react";

export default function StepCard({
  step,
  totalSteps = 5,
  title,
  subtitle,
  status,
  children,
}: {
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  status?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid var(--rule)",
        background: "var(--paper)",
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{
            fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "var(--ink-soft)",
          }}>
            Step {step} / {totalSteps}
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{title}</h2>
        </div>
        {status && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>{status}</div>}
      </div>
      {subtitle && <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 14 }}>{subtitle}</p>}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}
