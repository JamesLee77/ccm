import { Outlet, Link, NavLink, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Wordmark from "./brand/Wordmark";
import ThemeToggle from "./site/ThemeToggle";
import SafeBadge from "./site/SafeBadge";
import PersonaBadge from "./site/PersonaBadge";
import E2eModeBadge from "./site/E2eModeBadge";
import { IS_MAINNET } from "../lib/env";
import { usePersona } from "../lib/usePersona";
import { canViewRoute, PERSONA_LABEL, PERSONA_ROUTES } from "../lib/personas";

const NAV: { id: string; to: string }[] = [
  { id: "Token", to: "/" },
  { id: "Presale", to: "/tge" },
  { id: "Vesting", to: "/vesting" },
  { id: "KYC", to: "/kyc" },
  { id: "Timelock", to: "/timelock" },
];

const linkBase =
  "font-mono text-[11px] tracking-[0.12em] uppercase pb-0.5 border-b transition-colors";

export default function Layout() {
  const personaCtx = usePersona();
  const location = useLocation();
  const visibleNav = personaCtx.loading
    ? NAV
    : NAV.filter((it) => canViewRoute(personaCtx.persona, it.to));
  const allowedHere = personaCtx.loading || canViewRoute(personaCtx.persona, location.pathname);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <header
        className="sticky top-0 z-10 backdrop-blur-md border-b border-rule"
        style={{ background: "var(--nav-bg)" }}
      >
        <div className="px-6 md:px-14 py-4 flex items-center justify-between gap-6">
          <Link
            to="/"
            className="flex items-center gap-4 text-ink shrink-0"
            aria-label="CCM Network — operator console"
          >
            <Wordmark size={32} />
            <span
              className="font-mono text-[10px] tracking-[0.18em] uppercase hidden md:block pl-4 border-l border-rule"
              style={{
                lineHeight: 1.4,
                color: IS_MAINNET ? "var(--ink-soft)" : "var(--clay)",
              }}
            >
              Operator
              <br />
              {IS_MAINNET ? "Console" : "Console · TESTNET"}
            </span>
          </Link>

          <nav className="flex gap-7">
            {visibleNav.map((it) => (
              <NavLink
                key={it.id}
                to={it.to}
                end={it.to === "/"}
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "text-moss border-moss"
                      : "text-ink-soft border-transparent hover:text-ink"
                  }`
                }
              >
                {it.id}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <E2eModeBadge />
            <PersonaBadge ctx={personaCtx} />
            <SafeBadge />
            <ConnectButton
              chainStatus="icon"
              showBalance={false}
              accountStatus={{ smallScreen: "avatar", largeScreen: "address" }}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 md:px-14 py-10 md:py-14">
        {allowedHere ? (
          <Outlet />
        ) : (
          <div
            className="border p-8 text-center"
            style={{ borderColor: "var(--rule)", background: "var(--paper-deep)" }}
          >
            <div
              className="font-mono text-[10px] tracking-[0.18em] uppercase mb-3"
              style={{ color: "var(--clay)" }}
            >
              No access
            </div>
            <h2 className="font-display mb-3" style={{ fontSize: 24, color: "var(--ink)" }}>
              {PERSONA_LABEL[personaCtx.persona]} persona cannot view this page
            </h2>
            <p className="mb-5" style={{ color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.6 }}>
              Your persona has access to: <code style={{ color: "var(--moss)" }}>
              {PERSONA_ROUTES[personaCtx.persona].join(", ") || "(read-only — no write paths)"}</code>.
              {personaCtx.email && <> Logged in as <code>{personaCtx.email}</code>.</>}
            </p>
            <Link
              to={visibleNav[0]?.to ?? "/"}
              className="font-mono text-[11px] tracking-[0.14em] uppercase underline"
              style={{ color: "var(--moss)" }}
            >
              go to {visibleNav[0]?.id ?? "home"} →
            </Link>
          </div>
        )}
      </main>

      <footer
        className="border-t border-rule mt-20"
        style={{ background: "var(--paper-deep)", padding: "48px 24px 32px" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Wordmark size={28} />
            <span
              className="font-mono text-[10px] tracking-[0.18em] uppercase pl-3 border-l border-rule"
              style={{ color: "var(--ink-soft)", lineHeight: 1.4 }}
            >
              Operator
              <br />
              Console
            </span>
          </div>
          <div
            className="font-mono text-[11px] tracking-[0.04em] grid gap-2"
            style={{ color: "var(--ink-soft)", lineHeight: 1.6 }}
          >
            <p>
              Internal CCM Network operator console. Multi-chain (Base
              mainnet · Base Sepolia). Every action below is a real
              transaction; review before signing. The chain banner above
              indicates which network is active.
            </p>
            <p>
              Holder portal:{" "}
              <a
                className="text-moss hover:underline"
                href="https://portal.ccmnetwork.net"
              >
                portal.ccmnetwork.net
              </a>
              {" · "}
              Public testnet sandbox:{" "}
              <a
                className="text-moss hover:underline"
                href="https://testnet.ccmnetwork.net"
              >
                testnet.ccmnetwork.net
              </a>
              {" · "}
              Marketing:{" "}
              <a
                className="text-moss hover:underline"
                href="https://ccmnetwork.net"
              >
                ccmnetwork.net
              </a>
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <a href="https://ccmnetwork.net/terms" target="_blank" rel="noreferrer" className="hover:text-moss">Terms</a>
              <span style={{ color: "var(--rule)" }}>·</span>
              <a href="https://ccmnetwork.net/privacy" target="_blank" rel="noreferrer" className="hover:text-moss">Privacy</a>
              <span style={{ color: "var(--rule)" }}>·</span>
              <a href="https://ccmnetwork.net/disclaimer" target="_blank" rel="noreferrer" className="hover:text-moss">Risk disclosure</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
