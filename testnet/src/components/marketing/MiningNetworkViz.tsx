import { useTranslation } from "react-i18next";
import { useCumulativeTonnage } from "../../lib/onchain";

const RADIUS = 88;
const HUB_R = 28;
const VIEW = 240;

function formatHubNumber(v: bigint | undefined): string {
  if (v === undefined) return "0";
  return Number(v).toLocaleString();
}

export default function MiningNetworkViz() {
  const { t } = useTranslation();
  const minted = useCumulativeTonnage();
  const count = 7;
  const satellites = Array.from({ length: count }).map((_, i) => {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    return { i, x: Math.cos(a) * RADIUS, y: Math.sin(a) * RADIUS, delay: (i * 4) / count };
  });

  return (
    <section className="r-mining" style={{ marginBottom: 64 }}>
      <div style={{ width: 320, height: 320, position: "relative" }} aria-hidden="true">
        <svg width={320} height={320} viewBox={`-${VIEW / 2} -${VIEW / 2} ${VIEW} ${VIEW}`} style={{ overflow: "visible" }}>
          <g className="mn-spin-slow" style={{ transformOrigin: "center" }}>
            <circle cx={0} cy={0} r={RADIUS + 18} fill="none" stroke="var(--rule)" strokeWidth={0.6} strokeDasharray="2 6" />
          </g>
          <circle cx={0} cy={0} r={RADIUS} fill="none" stroke="var(--rule)" strokeWidth={0.5} />
          {satellites.map((s) => (
            <g key={s.i}>
              <line x1={0} y1={0} x2={s.x} y2={s.y} stroke="var(--rule)" strokeWidth={0.6} />
              <line x1={s.x} y1={s.y} x2={0} y2={0} stroke="var(--moss)" strokeWidth={1.4} strokeLinecap="round" className="mn-flow" style={{ animationDelay: `${s.delay}s` }} />
              <circle cx={s.x} cy={s.y} r={6} fill="var(--paper)" stroke="var(--moss)" strokeWidth={1.2} className="mn-pulse" style={{ animationDelay: `${s.delay}s`, transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties} />
            </g>
          ))}
          <circle cx={0} cy={0} r={HUB_R} fill="var(--ink)" stroke="var(--moss)" strokeWidth={1.4} />
          <text x={0} y={-4} textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize={7} letterSpacing={1} fill="var(--moss)">
            {t("mining.hubLabel").toUpperCase()}
          </text>
          <text x={0} y={9} textAnchor="middle" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize={9} fontWeight={500} letterSpacing={0.5} fill="var(--paper)">
            {formatHubNumber(minted.data)}t
          </text>
        </svg>
        <style>{`
          @keyframes mn-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes mn-flow-anim { 0% { stroke-dasharray: 0 200; stroke-dashoffset: 0; opacity: 0; } 20% { opacity: 0.9; } 80% { stroke-dasharray: 24 200; stroke-dashoffset: -200; opacity: 0.9; } 100% { stroke-dasharray: 24 200; stroke-dashoffset: -240; opacity: 0; } }
          @keyframes mn-pulse-anim { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.6); } }
          .mn-spin-slow { animation: mn-spin 60s linear infinite; }
          .mn-flow { animation: mn-flow-anim 4s linear infinite; stroke-dasharray: 0 200; }
          .mn-pulse { animation: mn-pulse-anim 4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) { .mn-spin-slow, .mn-flow, .mn-pulse { animation: none !important; } }
        `}</style>
      </div>
      <div>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--moss)", marginBottom: 12 }}>
          {t("mining.title")}
        </div>
        <p style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0, maxWidth: 480 }}>
          {t("mining.subtitle")}
        </p>
      </div>
    </section>
  );
}
