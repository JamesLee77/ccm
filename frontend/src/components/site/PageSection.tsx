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
    <section style={{ padding: "120px 56px" }}>
      <div
        className="grid items-end gap-12"
        style={{ gridTemplateColumns: right ? "1.4fr 1fr" : "1fr" }}
      >
        <div>
          <h1
            className="font-display"
            style={{
              fontWeight: 300,
              fontSize: "clamp(72px, 9vw, 132px)",
              lineHeight: 0.92,
              letterSpacing: "-0.035em",
              fontVariationSettings: '"opsz" 144',
              margin: 0,
            }}
          >
            {pre}{" "}
            <em className="italic-moss">{em}</em>
          </h1>
          <p
            className="font-body text-ink-soft mt-10 max-w-[680px]"
            style={{ fontSize: 22, lineHeight: 1.5 }}
          >
            {lead}
          </p>
        </div>
        {right ? <div className="flex justify-end">{right}</div> : null}
      </div>
    </section>
  );
}
