import { useTranslation } from "react-i18next";
import Wordmark from "../brand/Wordmark";

type FooterCol = {
  heading: string;
  links: { label: string; to: string; external?: boolean }[];
};

const COLS: FooterCol[] = [
  {
    heading: "network",
    links: [
      { label: "Standard", to: "/" },
      { label: "CCMine", to: "/ccmine" },
      { label: "Tokenomics", to: "/tokenomics" },
      { label: "Roadmap", to: "/roadmap" },
    ],
  },
  {
    heading: "build",
    links: [
      { label: "Whitepaper", to: "/whitepaper" },
      { label: "GitHub ↗", to: "https://github.com/JamesLee77/ccm", external: true },
      { label: "Smart contracts", to: "#" },
      { label: "Audit reports", to: "#" },
    ],
  },
  {
    heading: "foundation",
    links: [
      { label: "About", to: "#" },
      { label: "VVB partners", to: "#" },
      { label: "Press kit", to: "#" },
      { label: "Contact", to: "#" },
    ],
  },
];

export default function SiteFooter() {
  const { t } = useTranslation("footer");
  return (
    <footer
      className="border-t border-rule"
      style={{ background: "var(--paper-deep)", padding: "64px 56px 48px" }}
    >
      <div
        className="grid gap-12"
        style={{ gridTemplateColumns: "1.4fr 1fr 1fr 1fr" }}
      >
        <div>
          <Wordmark size={32} />
          <div className="mt-4.5 font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft leading-7">
            CCM Foundation
            <br />
            ccm.network · ccm.earth
            <br />
            foundation@ccm.network
          </div>
        </div>
        {COLS.map((col) => (
          <div key={col.heading}>
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3.5">
              {t(col.heading, col.heading)}
            </div>
            <div className="grid gap-2 font-mono text-[13px] text-ink-soft">
              {col.links.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.to}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink-soft hover:text-moss transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <a
                    key={link.label}
                    href={link.to}
                    className="text-ink-soft hover:text-moss transition-colors"
                  >
                    {link.label}
                  </a>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-12 pt-6 border-t border-rule flex justify-between font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
      >
        <span>© 2026 CCM Foundation · CC BY 4.0</span>
        <span>Whitepaper v1.0 · May 2026</span>
      </div>
    </footer>
  );
}
