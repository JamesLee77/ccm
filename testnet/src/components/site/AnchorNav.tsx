import { useTranslation } from "react-i18next";

type Anchor = { id: string; key: "network" | "oracle" | "yield" | "activity" | "playground" };

const ANCHORS: Anchor[] = [
  { id: "network", key: "network" },
  { id: "oracle", key: "oracle" },
  { id: "yield", key: "yield" },
  { id: "activity", key: "activity" },
  { id: "playground", key: "playground" },
];

export default function AnchorNav() {
  const { t } = useTranslation();
  const handleClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <nav
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      {ANCHORS.map((a) => (
        <a
          key={a.id}
          href={`#${a.id}`}
          onClick={handleClick(a.id)}
          style={{
            padding: "6px 10px",
            color: "var(--ink-soft)",
            textDecoration: "none",
            borderRadius: 4,
            transition: "color 120ms, background 120ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--ink)";
            e.currentTarget.style.background = "var(--paper-deep)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--ink-soft)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {t(`anchorNav.${a.key}`)}
        </a>
      ))}
    </nav>
  );
}
