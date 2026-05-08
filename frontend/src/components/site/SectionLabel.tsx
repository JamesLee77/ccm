type Props = {
  /** Section number, e.g. "§ 03". Renders as moss mono uppercase. */
  index?: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Mono uppercase moss section label — 11px / 0.16em / uppercase.
 * Matches sharedStylesFor.sectionLabel from the design reference.
 */
export default function SectionLabel({ index, children, className }: Props) {
  return (
    <div
      className={`font-mono text-[11px] tracking-[0.16em] uppercase text-moss ${
        className ?? ""
      }`}
    >
      {index ? <span className="text-ink-soft">{index} · </span> : null}
      {children}
    </div>
  );
}
