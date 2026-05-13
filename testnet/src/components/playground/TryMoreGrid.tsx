import { useTranslation } from "react-i18next";

export default function TryMoreGrid() {
  const { t } = useTranslation();
  const items = [
    { key: "lending", label: t("tryMore.lending") },
    { key: "yield", label: t("tryMore.yield") },
    { key: "basket", label: t("tryMore.basket") },
    { key: "retire", label: t("tryMore.retire") },
  ];
  return (
    <section style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-soft)", marginBottom: 12 }}>
        {t("tryMore.title")}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        {items.map((it) => (
          <div
            key={it.key}
            style={{
              border: "1px solid var(--rule)",
              padding: 16,
              opacity: 0.55,
              cursor: "not-allowed",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            {it.label}
          </div>
        ))}
      </div>
    </section>
  );
}
