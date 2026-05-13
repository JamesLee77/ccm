import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Wordmark from "../brand/Wordmark";
import ThemeToggle from "./ThemeToggle";

type NavItem = { id: string; to: string };

const NAV_ITEMS: NavItem[] = [
  { id: "Overview", to: "/" },
  { id: "Demo", to: "/demo" },
  { id: "About", to: "/about" },
];

const linkBase =
  "font-mono text-[11px] tracking-[0.12em] uppercase pb-0.5 border-b transition-colors";

export default function TestnetNav() {
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

  return (
    <header
      className="sticky top-0 z-10 backdrop-blur-md border-b border-rule"
      style={{ background: "var(--nav-bg)" }}
    >
      <div className="px-6 md:px-14 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-4 text-ink"
          aria-label="CCM Network — testnet sandbox"
        >
          <Wordmark size={32} />
          <span
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink-soft hidden md:block pl-4 border-l border-rule"
            style={{ lineHeight: 1.4 }}
          >
            Testnet
            <br />
            Sandbox
          </span>
        </Link>

        <nav className="hidden md:flex gap-7">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "text-moss border-moss"
                    : "text-ink-soft border-transparent hover:text-ink"
                }`
              }
            >
              {item.id}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
            />
          </div>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="md:hidden flex items-center justify-center border border-rule"
            style={{ width: 36, height: 36, background: "transparent", cursor: "pointer" }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
            >
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
          <nav className="flex flex-col py-4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `font-mono text-[13px] tracking-[0.14em] uppercase px-5 py-3 border-l-2 ${
                    isActive
                      ? "text-moss border-moss"
                      : "text-ink-soft border-transparent hover:text-ink"
                  }`
                }
              >
                {item.id}
              </NavLink>
            ))}
            <div className="px-5 pt-4">
              <ConnectButton chainStatus="icon" showBalance={false} accountStatus="address" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
