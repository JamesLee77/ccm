type Props = {
  w?: number;
  h?: number;
  /** Override line color. Defaults to var(--moss). */
  accent?: string;
  className?: string;
};

/**
 * Measurement signal plot — sine + cosine composite over 60 points with
 * marker dots every 8 steps. Visualizes the "measure → emit signal" theme.
 * Ported from site-shared.jsx.
 */
export default function SignalPlot({
  w = 480,
  h = 120,
  accent,
  className,
}: Props) {
  const ac = accent ?? "var(--moss)";
  const pts = Array.from({ length: 60 }).map((_, i) => {
    const x = (i / 59) * w;
    const y =
      h / 2 +
      Math.sin(i * 0.34) * (h * 0.28) +
      Math.cos(i * 0.11) * (h * 0.08);
    return [x, y] as const;
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <svg
      width={w}
      height={h}
      style={{ display: "block" }}
      className={className}
      aria-hidden="true"
    >
      <line
        x1="0"
        y1={h / 2}
        x2={w}
        y2={h / 2}
        stroke="var(--rule)"
        strokeWidth="0.6"
        strokeDasharray="2 4"
      />
      <path d={d} stroke={ac} strokeWidth="1.2" fill="none" />
      {pts
        .filter((_, i) => i % 8 === 0)
        .map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r="2"
            fill="var(--paper)"
            stroke={ac}
            strokeWidth="1"
          />
        ))}
    </svg>
  );
}
