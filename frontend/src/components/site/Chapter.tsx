import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Section, { type SectionTone } from "./Section";
import SectionLabel from "./SectionLabel";
import Heading from "./Heading";

export type ChapterProps = {
  id: string;
  /** Two-digit chapter number, e.g. "02". Rendered as "§ 02 · label". */
  index: string;
  label: string;
  tone?: SectionTone;
  pre: string;
  em?: string;
  lead?: string;
  /** "Go deeper" link to the page that carries the full section. */
  deeper?: { to: string; label: string };
  /** Exactly one signature visual. */
  children: ReactNode;
};

/**
 * Home-page chapter: index label → heading → lead → one signature visual →
 * optional deeper link. Renders a real `<section id>` so the mobile CSS
 * overrides keyed on `section[id]` apply unchanged.
 */
export default function Chapter({
  id,
  index,
  label,
  tone = "paper",
  pre,
  em,
  lead,
  deeper,
  children,
}: ChapterProps) {
  return (
    <Section id={id} tone={tone}>
      <SectionLabel index={`§ ${index}`}>{label}</SectionLabel>
      <Heading pre={pre} em={em} maxWidth={900} className="mt-8 mb-8" />
      {lead ? (
        <p
          className="font-body text-ink-soft mb-12"
          style={{ fontSize: 20, lineHeight: 1.5, maxWidth: 720 }}
        >
          {lead}
        </p>
      ) : null}
      {children}
      {deeper ? (
        <div className="mt-12">
          <Link
            to={deeper.to}
            className="chapter-deeper font-mono text-[12px] tracking-[0.14em] uppercase px-6 py-3.5 border border-rule text-ink hover:border-moss hover:text-moss transition-colors inline-flex items-center gap-3"
          >
            <span>{deeper.label}</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      ) : null}
    </Section>
  );
}
