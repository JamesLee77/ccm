import type { ReactNode, CSSProperties } from "react";

export type SectionTone = "paper" | "deep" | "inverted";

type Props = {
  id?: string;
  /**
   * Background band. `paper` is the page ground, `deep` is the recessed
   * paper-deep band, `inverted` flips to ink-on-paper. Panels inside read
   * `var(--panel)` so they keep contrast against whichever band they sit on.
   */
  tone?: SectionTone;
  /** Removes the top hairline. Used on the first section. */
  noBorder?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

const TONE_STYLE: Record<SectionTone, CSSProperties> = {
  paper: { "--panel": "var(--paper-deep)" } as CSSProperties,
  deep: {
    background: "var(--band-deep)",
    "--panel": "var(--paper)",
  } as CSSProperties,
  // Colours for the inverted band are swapped in index.css so Tailwind
  // utilities (text-ink, bg-paper, border-rule) invert with it.
  inverted: { "--panel": "var(--paper-deep)" } as CSSProperties,
};

/**
 * Standard page section — 96px vertical / 56px horizontal padding on
 * desktop (mobile overrides live in index.css), top hairline, tone band.
 */
export default function Section({
  id,
  tone = "paper",
  noBorder,
  className,
  style,
  children,
}: Props) {
  return (
    <section
      id={id}
      data-tone={tone}
      className={`${noBorder ? "" : "border-t border-rule"} ${className ?? ""}`}
      style={{
        padding: "96px 56px",
        ...TONE_STYLE[tone],
        ...style,
      }}
    >
      {children}
    </section>
  );
}
