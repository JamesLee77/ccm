import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Wordmark from "../brand/Wordmark";
import ThemeToggle from "./ThemeToggle";
import CarbonPriceBadge from "../marketing/CarbonPriceBadge";
import { scrollToId } from "../../lib/scroll";
import { useReducedMotion } from "../../hooks/useReducedMotion";

type Anchor = { id: "network" | "oracle" | "yield" | "activity" | "playground" };

const ANCHORS: Anchor[] = [
  { id: "network" },
  { id: "oracle" },
  { id: "yield" },
  { id: "activity" },
  { id: "playground" },
];

const SITE_URL = "https://ccmnetwork.net";

const linkBase =
  "font-mono text-[11px] tracking-[0.12em] uppercase pb-0.5 border-b border-transparent transition-colors text-ink-soft hover:text-ink";

/**
 * Sticky site header — same anatomy as ccmnetwork.net's SiteNav:
 * wordmark + tagline, mono in-page links, price badge, theme toggle,
 * hamburger drawer below md.
 */
export default function Nav() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(id, reduced ? "auto" : "smooth");
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <header
      className="sticky top-0 z-10 backdrop-blur-md border-b border-rule"
      style={{ background: "var(--nav-bg)" }}
    >
      <div className="px-6 md:px-14 py-4 flex items-center justify-between">
        <a
          href={SITE_URL}
          className="flex items-center gap-4 text-ink"
          aria-label="CCM Network — home"
        >
          <Wordmark size={32} />
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase hidden md:block pl-4 border-l border-rule"
            style={{ lineHeight: 1.4, color: "var(--clay)" }}
          >
            {t("nav.title")}
            <br />
            base sepolia
          </span>
        </a>

        {/* Desktop in-page links */}
        <nav className="hidden md:flex gap-7" aria-label="Sections">
          {ANCHORS.map((a) => (
            <a key={a.id} href={`#${a.id}`} onClick={go(a.id)} className={linkBase}>
              {t(`anchorNav.${a.id}`)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={SITE_URL}
            className="font-mono text-[11px] tracking-[0.12em] uppercase px-3 py-1.5 border hidden md:inline-flex items-center text-moss border-moss hover:text-paper hover:bg-moss transition-colors"
          >
            {t("nav.site")}
          </a>
          <span className="hidden md:inline-flex"><CarbonPriceBadge /></span>
          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden flex items-center justify-center border border-rule"
            style={{ width: 36, height: 36, background: "transparent", cursor: "pointer" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              {open ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div className="md:hidden border-t border-rule" style={{ background: "var(--paper)" }}>
          <nav className="flex flex-col py-4" aria-label="Sections">
            {ANCHORS.map((a) => (
              <a
                key={a.id}
                href={`#${a.id}`}
                onClick={go(a.id)}
                className="font-mono text-[13px] tracking-[0.14em] uppercase px-5 py-3 border-l-2 text-ink-soft border-transparent hover:text-ink"
              >
                {t(`anchorNav.${a.id}`)}
              </a>
            ))}
            <div className="px-5 pt-4">
              <a
                href={SITE_URL}
                className="font-mono text-[13px] tracking-[0.14em] uppercase px-4 py-3 border inline-flex items-center justify-center w-full text-moss border-moss hover:text-paper hover:bg-moss transition-colors"
              >
                {t("nav.site")}
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
