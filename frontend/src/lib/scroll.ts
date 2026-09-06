/** Height of the sticky site header plus a small breathing gap. */
export function headerOffset(): number {
  if (typeof document === "undefined") return 0;
  const h = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
  return h + 8;
}

/**
 * Scrolls the element with `id` to just below the sticky header.
 * Returns false when no such element is mounted yet.
 */
export function scrollToId(id: string, behavior: ScrollBehavior = "smooth"): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset();
  window.scrollTo({ top, behavior });
  return true;
}
