import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Wordmark from "../brand/Wordmark";
import ThemeToggle from "./ThemeToggle";

type NavItem = {
  id: string;
  to: string;
  end?: boolean;
  external?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "standard", to: "/" , end: true },
  { id: "ccmine", to: "/ccmine" },
  { id: "tokenomics", to: "/tokenomics" },
  { id: "roadmap", to: "/roadmap" },
  { id: "whitepaper", to: "/whitepaper" },
  { id: "app", to: "/markets" },
];

const linkBase =
  "font-mono text-[11px] tracking-[0.12em] uppercase pb-0.5 border-b transition-colors";

export default function SiteNav() {
  const { t } = useTranslation("nav");
  return (
    <header
      className="sticky top-0 z-10 backdrop-blur-md border-b border-rule"
      style={{ background: "var(--nav-bg)" }}
    >
      <div className="px-14 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3.5 text-ink">
          <Wordmark size={22} />
          <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft">
            ccm.network
          </span>
        </Link>

        <nav className="flex gap-7">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "text-moss border-moss"
                    : "text-ink-soft border-transparent hover:text-ink"
                }`
              }
            >
              {t(item.id)}
            </NavLink>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
