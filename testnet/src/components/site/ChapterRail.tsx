import { useEffect, useState } from "react";
import { scrollToId } from "../../lib/scroll";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export type RailItem = {
  id: string;
  label: string;
};

type Props = {
  items: RailItem[];
};

/**
 * Fixed left-edge chapter rail — desktop only (≥ 1280px, where index.css
 * widens the page gutter to 96px so the rail has its own column). One
 * numeral per section; the active section (or a hovered one) also shows
 * its label set vertically so it stays inside the gutter.
 */
export default function ChapterRail({ items }: Props) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Chapters"
      className="chapter-rail hidden xl:flex fixed left-4 top-1/2 -translate-y-1/2 z-[5] flex-col gap-2"
    >
      {items.map((it, i) => {
        const isActive = active === it.id;
        return (
          <a
            key={it.id}
            href={`#${it.id}`}
            aria-current={isActive ? "true" : undefined}
            onClick={(e) => {
              e.preventDefault();
              scrollToId(it.id, reduced ? "auto" : "smooth");
              history.replaceState(null, "", `#${it.id}`);
            }}
            className={`group relative flex items-center gap-2 py-1 font-mono text-[10px] tracking-[0.16em] uppercase transition-colors ${
              isActive ? "text-moss" : "text-ink-soft hover:text-ink"
            }`}
          >
            <span
              aria-hidden
              className="block h-px transition-all"
              style={{
                width: isActive ? 14 : 6,
                background: isActive ? "var(--moss)" : "var(--rule)",
              }}
            />
            <span style={{ width: 18 }}>{String(i + 1).padStart(2, "0")}</span>
            <span
              className={`chapter-rail-label absolute left-full top-1/2 -translate-y-1/2 whitespace-nowrap transition-opacity ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {it.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
