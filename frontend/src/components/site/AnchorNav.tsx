import { useEffect, useState } from "react";

export type AnchorItem = {
  id: string;
  label: string;
};

type Props = {
  items: AnchorItem[];
};

/**
 * Sticky in-page anchor navigator — sits below SiteNav, lists section
 * anchors. Tracks the active section using IntersectionObserver and
 * highlights with the moss color.
 */
export default function AnchorNav({ items }: Props) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry that is most prominently in view.
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
      aria-label="In-page navigation"
      className="sticky top-[64px] z-[5] border-y border-rule overflow-x-auto"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(8px)" }}
    >
      <ul className="flex gap-6 px-14 py-3 font-mono text-[11px] tracking-[0.12em] uppercase whitespace-nowrap">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className={`pb-0.5 border-b transition-colors ${
                active === it.id
                  ? "text-moss border-moss"
                  : "text-ink-soft border-transparent hover:text-ink"
              }`}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
