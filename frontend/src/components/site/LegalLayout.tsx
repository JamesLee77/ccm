import type { ReactNode } from "react";

/**
 * Long-form legal document wrapper. Stays inside the marketing site's
 * Layout (paper bg, dark-toggle, nav, footer) but constrains content
 * width to ~720px and uses readable line-height + spacing for serif-ish
 * legal copy. Legal content is plain HTML structure (h2/h3/p/ul) so it
 * stays grep-able and easy to diff.
 */
export default function LegalLayout({
  title,
  effective,
  children,
}: {
  title: string;
  effective: string;
  children: ReactNode;
}) {
  return (
    <div style={{ background: "var(--paper)", color: "var(--ink)", minHeight: "100vh" }}>
      <div className="max-w-[760px] mx-auto px-6 md:px-10 py-12 md:py-20">
        <header className="mb-10 pb-8 border-b" style={{ borderColor: "var(--rule)" }}>
          <div
            className="font-mono text-[11px] tracking-[0.18em] uppercase mb-4"
            style={{ color: "var(--clay)" }}
          >
            Legal · Draft for review
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(32px, 4vw, 44px)",
              lineHeight: 1.1,
              letterSpacing: "-0.025em",
              fontWeight: 300,
              margin: 0,
            }}
          >
            {title}
          </h1>
          <p
            className="font-mono text-[11px] mt-4"
            style={{ color: "var(--ink-soft)" }}
          >
            Effective date: {effective} · Last updated: {effective}
          </p>
          <div
            className="mt-6 border p-4 font-mono text-[12px]"
            style={{ background: "rgba(200,96,46,0.06)", borderColor: "var(--clay)", color: "var(--ink)", lineHeight: 1.6 }}
          >
            <strong style={{ color: "var(--clay)" }}>Draft notice.</strong> This
            document is a draft prepared for legal counsel review. It has not
            been reviewed or approved by a licensed attorney for any specific
            jurisdiction. Do not rely on it as final until reviewed and signed
            off by qualified legal counsel for the jurisdictions where CCM
            Network operates.
          </div>
        </header>

        <div className="legal-prose">{children}</div>

        <footer className="mt-16 pt-8 border-t font-mono text-[11px]" style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}>
          <p>
            Questions? Contact{" "}
            <a className="text-moss hover:underline" href="mailto:legal@ccmnetwork.net">
              legal@ccmnetwork.net
            </a>
            .
          </p>
        </footer>
      </div>

      <style>{`
        .legal-prose h2 {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 500;
          line-height: 1.25;
          letter-spacing: -0.015em;
          margin: 40px 0 16px;
          color: var(--ink);
        }
        .legal-prose h3 {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 500;
          line-height: 1.3;
          margin: 28px 0 12px;
          color: var(--ink);
        }
        .legal-prose p {
          font-size: 15px;
          line-height: 1.7;
          color: var(--ink);
          margin: 12px 0;
        }
        .legal-prose ul, .legal-prose ol {
          font-size: 15px;
          line-height: 1.7;
          color: var(--ink);
          padding-left: 24px;
          margin: 12px 0;
        }
        .legal-prose ul li { list-style-type: disc; margin: 6px 0; }
        .legal-prose ol li { list-style-type: decimal; margin: 6px 0; }
        .legal-prose strong { font-weight: 600; }
        .legal-prose code {
          font-family: var(--font-mono);
          font-size: 13px;
          background: var(--paper-deep);
          padding: 2px 6px;
          color: var(--ink);
        }
        .legal-prose a { color: var(--moss); text-decoration: underline; }
      `}</style>
    </div>
  );
}
