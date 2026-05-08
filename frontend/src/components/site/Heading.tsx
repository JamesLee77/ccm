import type { ReactNode } from "react";

const styles = {
  h1: {
    fontWeight: 500,
    fontSize: "clamp(72px, 9vw, 132px)",
    lineHeight: 0.92,
    letterSpacing: "-0.025em",
    margin: 0,
  },
  h2: {
    fontWeight: 500,
    fontSize: "clamp(40px, 5vw, 64px)",
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  h3: {
    fontWeight: 500,
    fontSize: 32,
    lineHeight: 1.1,
    letterSpacing: "-0.015em",
    margin: 0,
  },
} as const;

type Variant = keyof typeof styles;

type Props = {
  as?: Variant;
  pre: ReactNode;
  em?: ReactNode;
  br?: boolean;
  className?: string;
  maxWidth?: number | string;
};

/**
 * Display heading with optional moss accent. Pattern matches
 * "First half. *Second half.*" used throughout the design reference.
 * Under the grotesk-mono pairing the accent is moss + weight 600
 * (italic dropped per design system).
 */
export default function Heading({
  as = "h2",
  pre,
  em,
  br = true,
  className,
  maxWidth,
}: Props) {
  const Tag = as as keyof React.JSX.IntrinsicElements;
  return (
    <Tag
      className={`font-display ${className ?? ""}`}
      style={{
        ...styles[as],
        ...(maxWidth ? { maxWidth } : null),
      }}
    >
      {pre}
      {em ? (
        <>
          {br ? <br /> : " "}
          <em className="italic-moss">{em}</em>
        </>
      ) : null}
    </Tag>
  );
}
