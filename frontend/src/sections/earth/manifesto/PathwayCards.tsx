type Pathway = {
  id: string;
  num: string;
  audience: string;
  body: string;
  links: { label: string; href: string }[];
  icon: React.ReactNode;
};

const PATHWAYS: Pathway[] = [
  {
    id: "investor",
    num: "01",
    audience: "Investors",
    body: "Read the long form, review tokenomics, and route discussion to investor relations for the current round.",
    links: [
      { label: "Whitepaper · 39 pages", href: "https://github.com/JamesLee77/ccm/blob/main/docs/CCM_Network_Whitepaper_v1.0.pdf" },
      { label: "Tokenomics summary", href: "#tokenomics" },
      { label: "Investor relations →", href: "mailto:foundation@ccmnetwork.net?subject=Investor%20relations" },
    ],
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 24l6-7 5 4 7-9 6 5" />
        <path d="M22 17h6v6" />
      </g>
    ),
  },
  {
    id: "operator",
    num: "02",
    audience: "Node operators",
    body: "Run a physical, verification, or storage node. Stake $CCM, earn per verified tonne reduced.",
    links: [
      { label: "CCMine onboarding", href: "#mining" },
      { label: "Hardware reference", href: "https://github.com/JamesLee77/ccm" },
      { label: "Apply to operate →", href: "mailto:foundation@ccmnetwork.net?subject=Node%20operator" },
    ],
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x={6} y={9} width={20} height={4} rx={1} />
        <rect x={6} y={15} width={20} height={4} rx={1} />
        <rect x={6} y={21} width={20} height={4} rx={1} />
        <circle cx={10} cy={11} r={1} fill="currentColor" />
        <circle cx={10} cy={17} r={1} fill="currentColor" />
        <circle cx={10} cy={23} r={1} fill="currentColor" />
      </g>
    ),
  },
  {
    id: "buyer",
    num: "03",
    audience: "ESG buyers",
    body: "Acquire CCM-A or higher for net-zero reporting. Onchain retire produces an immutable audit certificate.",
    links: [
      { label: "Grading system", href: "#grades" },
      { label: "Retire-to-earn", href: "#defi" },
      { label: "Buy-and-retire desk →", href: "mailto:foundation@ccmnetwork.net?subject=ESG%20buyer" },
    ],
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 4l9 5v7c0 5-4 9-9 11-5-2-9-6-9-11V9z" />
        <path d="M12 16l3 3 6-6" />
      </g>
    ),
  },
  {
    id: "researcher",
    num: "04",
    audience: "Researchers",
    body: "Standard published CC BY 4.0. Contribute to MRV methodology, oracle integrations, and dispute case law.",
    links: [
      { label: "Standard repository", href: "https://github.com/JamesLee77/ccm" },
      { label: "Architecture deep-dive", href: "#arch" },
      { label: "Foundation contact →", href: "mailto:foundation@ccmnetwork.net?subject=Research" },
    ],
    icon: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx={14} cy={14} r={8} />
        <path d="M20 20l6 6" />
        <path d="M11 14h6M14 11v6" />
      </g>
    ),
  },
];

export default function PathwayCards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {PATHWAYS.map((p) => (
        <div
          key={p.id}
          className="border border-rule transition-all"
          style={{
            background: "var(--paper-deep)",
            padding: "28px 24px",
            cursor: "default",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--moss)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--rule)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="text-moss" style={{ width: 32, height: 32 }}>
              <svg viewBox="0 0 32 32" width="32" height="32">
                {p.icon}
              </svg>
            </div>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-moss">
              {p.num}
            </div>
          </div>
          <div
            className="font-display text-ink mt-3 mb-2"
            style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.015em" }}
          >
            {p.audience}
          </div>
          <div
            className="font-body text-ink-soft mb-5"
            style={{ fontSize: 13, lineHeight: 1.55 }}
          >
            {p.body}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {p.links.map((l, i) => (
              <li
                key={l.label}
                className={i > 0 ? "border-t border-rule" : ""}
                style={{ padding: "10px 0" }}
              >
                <a
                  href={l.href}
                  className="font-mono text-ink hover:text-moss transition-colors"
                  style={{ fontSize: 12, letterSpacing: 0.4 }}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
