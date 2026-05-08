import { useState } from "react";

type Contact = {
  id: string;
  label: string;
  email: string;
  body: string;
  responseTime: string;
};

const CONTACTS: Contact[] = [
  {
    id: "ir",
    label: "Investor relations",
    email: "ir@ccmnetwork.net",
    body: "Round terms, vesting clarifications, KYC paperwork, and follow-on participation.",
    responseTime: "≤ 24h business",
  },
  {
    id: "press",
    label: "Press",
    email: "press@ccmnetwork.net",
    body: "Media inquiries, briefings, embargoed coverage, and asset requests for the press kit.",
    responseTime: "≤ 48h",
  },
  {
    id: "foundation",
    label: "Foundation",
    email: "foundation@ccmnetwork.net",
    body: "Standards bodies, VVB onboarding, partnership inquiries, and academic collaboration.",
    responseTime: "≤ 72h",
  },
];

export default function ContactPanel() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="border border-rule"
      style={{ background: "var(--paper-deep)", padding: "32px 40px" }}
    >
      <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-6">
        direct lines
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
          marginBottom: 32,
        }}
      >
        {CONTACTS.map((c) => (
          <div
            key={c.id}
            className="border border-rule"
            style={{ background: "var(--paper)", padding: "20px 24px" }}
          >
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-moss mb-2">
              {c.label}
            </div>
            <a
              href={`mailto:${c.email}`}
              className="font-display text-ink hover:text-moss transition-colors block mb-3"
              style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              {c.email}
            </a>
            <div
              className="font-body text-ink-soft mb-4"
              style={{ fontSize: 13, lineHeight: 1.55 }}
            >
              {c.body}
            </div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-soft pt-3 border-t border-rule">
              {c.responseTime}
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter signup */}
      <div
        className="border border-rule"
        style={{ background: "var(--paper)", padding: "24px 28px" }}
      >
        <div
          className="grid items-end"
          style={{ gridTemplateColumns: "1fr 1.6fr auto", gap: 24 }}
        >
          <div>
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-2">
              dispatch
            </div>
            <div
              className="font-display text-ink"
              style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.15 }}
            >
              Audit, TGE, mainnet — only the moments that matter.
            </div>
            <div
              className="font-body text-ink-soft mt-2"
              style={{ fontSize: 13, lineHeight: 1.5 }}
            >
              Quarterly cadence. No fluff. Unsubscribe anywhere in the email.
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSubmitted(true);
            }}
            className="flex border border-rule"
            style={{ background: "var(--paper-deep)" }}
            aria-label="Newsletter signup"
          >
            <input
              type="email"
              placeholder="you@firm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="font-mono px-4 py-3 bg-transparent text-ink outline-none flex-1"
              style={{
                fontSize: 13,
                border: 0,
                minWidth: 0,
              }}
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              className="font-mono uppercase tracking-[0.14em] px-5 py-3 transition-colors"
              style={{
                fontSize: 11,
                background: "var(--ink)",
                color: "var(--paper)",
                border: 0,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--moss)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--ink)";
              }}
            >
              {submitted ? "queued ✓" : "subscribe →"}
            </button>
          </form>
          <div
            className="font-mono text-[10px] tracking-[0.14em] uppercase"
            style={{ color: submitted ? "var(--moss)" : "var(--ink-soft)" }}
          >
            {submitted ? "added to list" : "no spam"}
          </div>
        </div>
      </div>
    </div>
  );
}
