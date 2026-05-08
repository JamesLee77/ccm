import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

type Doc = {
  id: string;
  category: string;
  title: string;
  detail: string;
  format: string;
  size: string;
  href: string;
  external?: boolean;
  status?: "ready" | "draft" | "soon";
};

const DOCS: Doc[] = [
  {
    id: "whitepaper",
    category: "primary",
    title: "Whitepaper · v1.0",
    detail: "39 pages · 14 chapters · CC BY 4.0",
    format: "PDF",
    size: "4.2 MB",
    href: "https://github.com/JamesLee77/ccm/blob/main/docs/CCM_Network_Whitepaper_v1.0.pdf",
    external: true,
    status: "ready",
  },
  {
    id: "deck",
    category: "primary",
    title: "Investor deck · v1.0",
    detail: "16 slides · narrative summary",
    format: "PDF",
    size: "1.8 MB",
    href: "https://github.com/JamesLee77/ccm/blob/main/docs/CCM_Network_Deck_v1.0.pdf",
    external: true,
    status: "ready",
  },
  {
    id: "tokenomics",
    category: "supplemental",
    title: "Tokenomics paper",
    detail: "Allocation, vesting, emission curve, accrual",
    format: "PDF",
    size: "1.1 MB",
    href: "#tokenomics",
    status: "draft",
  },
  {
    id: "standard",
    category: "supplemental",
    title: "CCM Standard · spec",
    detail: "Apache 2.0 · MRV thresholds · grade definitions",
    format: "MD + JSON",
    size: "—",
    href: "https://github.com/JamesLee77/ccm",
    external: true,
    status: "ready",
  },
  {
    id: "audits",
    category: "audit",
    title: "External audit reports",
    detail: "Trail of Bits / OpenZeppelin / Quantstamp",
    format: "PDF",
    size: "—",
    href: "#",
    status: "soon",
  },
  {
    id: "press",
    category: "press",
    title: "Press kit",
    detail: "Logo, wordmark variants, photography, fact sheet",
    format: "ZIP",
    size: "—",
    href: "#",
    status: "soon",
  },
];

const STATUS_META: Record<NonNullable<Doc["status"]>, { label: string; color: string }> = {
  ready: { label: "ready", color: "var(--moss)" },
  draft: { label: "draft", color: "var(--moss-2)" },
  soon: { label: "post-tge", color: "var(--ink-soft)" },
};

export default function DocumentsLibrary() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);
  const [shown, setShown] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    const root = ref.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <ol
      ref={ref}
      className="border border-rule"
      style={{
        background: "var(--paper-deep)",
        listStyle: "none",
        padding: 0,
        margin: 0,
      }}
    >
      <li
        className="grid items-center font-mono text-[11px] tracking-[0.12em] uppercase text-ink-soft"
        style={{
          gridTemplateColumns: "120px 1.6fr 80px 80px 100px 24px",
          gap: 16,
          padding: "16px 24px",
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <span>category</span>
        <span>title · detail</span>
        <span>format</span>
        <span>size</span>
        <span>state</span>
        <span />
      </li>
      {DOCS.map((d, i) => {
        const status = d.status ?? "ready";
        const meta = STATUS_META[status];
        return (
          <li
            key={d.id}
            className="transition-colors"
            style={{
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0)" : "translateY(6px)",
              transition: reduced
                ? "none"
                : `opacity 320ms ease-out ${i * 60}ms, transform 320ms ease-out ${i * 60}ms`,
              borderBottom:
                i < DOCS.length - 1 ? "1px solid var(--rule)" : "none",
            }}
          >
            <a
              href={d.href}
              target={d.external ? "_blank" : undefined}
              rel={d.external ? "noreferrer" : undefined}
              className="grid items-center text-ink hover:bg-paper transition-colors"
              style={{
                gridTemplateColumns: "120px 1.6fr 80px 80px 100px 24px",
                gap: 16,
                padding: "16px 24px",
                textDecoration: "none",
              }}
            >
              <span className="font-mono text-moss" style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>
                {d.category}
              </span>
              <span>
                <span
                  className="font-display text-ink"
                  style={{ fontSize: 15, fontWeight: 500 }}
                >
                  {d.title}
                </span>
                <span
                  className="font-body text-ink-soft block"
                  style={{ fontSize: 12, lineHeight: 1.45 }}
                >
                  {d.detail}
                </span>
              </span>
              <span className="font-mono text-ink" style={{ fontSize: 11 }}>
                {d.format}
              </span>
              <span className="font-mono text-ink-soft" style={{ fontSize: 11 }}>
                {d.size}
              </span>
              <span className="font-mono" style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: meta.color }}>
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    background: meta.color,
                    marginRight: 6,
                    verticalAlign: "middle",
                  }}
                />
                {meta.label}
              </span>
              <span
                aria-hidden
                className="font-mono text-moss"
                style={{ fontSize: 14, textAlign: "right" }}
              >
                {d.external ? "↗" : "→"}
              </span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
