/**
 * Tiny primitives that compose the design system. Inherited from the
 * marketing site's visual vocabulary: paper background, hairline rule
 * borders, JetBrains Mono small caps for labels, Space Grotesk for
 * display text, sharp edges, no rounded corners.
 */
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  inset = "p-7",
}: {
  children: ReactNode;
  className?: string;
  inset?: string;
}) {
  return (
    <section
      className={`border ${inset} ${className}`}
      style={{ background: "var(--paper-deep)", borderColor: "var(--rule)" }}
    >
      {children}
    </section>
  );
}

export function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`font-mono text-[11px] tracking-[0.16em] uppercase ${className}`}
      style={{ color: "var(--ink-soft)" }}
    >
      {children}
    </div>
  );
}

export function H1({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={`font-display ${className}`}
      style={{
        fontSize: "clamp(36px, 5vw, 56px)",
        lineHeight: 1.05,
        letterSpacing: "-0.025em",
        fontWeight: 300,
        margin: 0,
      }}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={`font-display ${className}`}
      style={{
        fontSize: "clamp(22px, 2.6vw, 28px)",
        lineHeight: 1.2,
        letterSpacing: "-0.02em",
        fontWeight: 400,
        margin: 0,
      }}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h3
      className={`font-display ${className}`}
      style={{
        fontSize: 18,
        lineHeight: 1.3,
        letterSpacing: "-0.01em",
        fontWeight: 500,
        margin: 0,
      }}
    >
      {children}
    </h3>
  );
}

export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`max-w-[680px] ${className}`}
      style={{
        color: "var(--ink-soft)",
        fontSize: 16,
        lineHeight: 1.65,
      }}
    >
      {children}
    </p>
  );
}

export function CTA({
  label,
  onClick,
  disabled = false,
  variant = "primary",
  type = "button",
  fullWidth = false,
}: {
  label: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
  fullWidth?: boolean;
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`font-mono text-[11px] tracking-[0.14em] uppercase px-4 py-2.5 transition-colors ${
        fullWidth ? "w-full" : ""
      }`}
      style={{
        background: disabled
          ? "transparent"
          : isPrimary
            ? "var(--moss)"
            : "transparent",
        color: disabled
          ? "var(--ink-soft)"
          : isPrimary
            ? "var(--paper)"
            : "var(--ink)",
        border: `1px solid ${
          disabled ? "var(--rule)" : isPrimary ? "var(--moss)" : "var(--rule)"
        }`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {label}
    </button>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ background: "var(--paper-deep)", padding: "20px 24px", border: "1px solid var(--rule)" }}>
      <div
        className="font-mono text-[10px] tracking-[0.14em] uppercase"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </div>
      <div
        className="font-display mt-2"
        style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em", color: "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}

export function DefRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b" style={{ borderColor: "var(--rule)" }}>
      <span
        className="font-mono text-[11px] tracking-[0.06em] uppercase"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </span>
      <span className="font-mono text-[13px]" style={{ color: "var(--ink)" }}>
        {value}
      </span>
    </div>
  );
}
