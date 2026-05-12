import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Optional uppercase mono section label rendered above the heading. */
  label?: string;
  className?: string;
};

/**
 * Standard page section. 120×56 padding, hairline top border, optional
 * mono label. Matches sharedStylesFor(T,isDark).section.
 */
export default function PageSection({ children, label, className }: Props) {
  return (
    <section
      className={`border-t border-rule ${className ?? ""}`}
      style={{ padding: "120px 56px" }}
    >
      {label ? (
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-8">
          {label}
        </div>
      ) : null}
      {children}
    </section>
  );
}

type HeroProps = {
  pre: string;
  em: string;
  lead: string;
  right?: ReactNode;
};

/**
 * Hero block — h1 with italic-moss accent + lead body + optional right
 * column figure. Matches LandingEarth/CCMine hero pattern.
 */
export function PageHero({ pre, em, lead, right }: HeroProps) {
  return (
    <section className="px-6 py-20 md:px-14 md:py-30">
      <div
        className={`grid items-end gap-12 ${
          right ? "md:grid-cols-[1.4fr_1fr]" : ""
        }`}
      >
        <div className="min-w-0">
          <h1
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: "clamp(44px, 9vw, 132px)",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              fontVariationSettings: '"opsz" 144',
              margin: 0,
              overflowWrap: "break-word",
            }}
          >
            {pre}{" "}
            <em className="italic-moss">{em}</em>
          </h1>
          <p
            className="font-body text-ink-soft mt-8 max-w-[680px]"
            style={{ fontSize: 18, lineHeight: 1.55 }}
          >
            {lead}
          </p>
        </div>
        {right ? (
          <div className="hidden md:flex justify-end">{right}</div>
        ) : null}
      </div>
    </section>
  );
}
