import type { ReactNode, CSSProperties } from "react";

type Props = {
  id?: string;
  /** Inverted dark section (e.g. Problem). */
  inverted?: boolean;
  /** Removes the top hairline. Used on the first section. */
  noBorder?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Standard page section — 120px vertical / 56px horizontal padding,
 * top hairline. Matches sharedStylesFor.section from the design ref.
 */
export default function Section({
  id,
  inverted,
  noBorder,
  className,
  style,
  children,
}: Props) {
  return (
    <section
      id={id}
      className={`${noBorder ? "" : "border-t border-rule"} ${className ?? ""}`}
      style={{
        padding: "120px 56px",
        ...(inverted
          ? { background: "var(--ink)", color: "var(--paper)" }
          : null),
        ...style,
      }}
    >
      {children}
    </section>
  );
}
