type Props = {
  count?: number;
  size?: number;
  label?: string;
  className?: string;
};

/**
 * Network diagram — central hub + N satellite nodes on a circle of radius 88.
 * Hub is a 22-radius ink circle with the label centered in JetBrains Mono.
 * Used as the right-side hero figure on multiple pages.
 *
 * Ported from site-shared.jsx with tokens routed through CSS variables so it
 * automatically tracks theme changes.
 */
export default function NodeNetwork({
  count = 7,
  size = 240,
  label = "CCM",
  className,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-120 -120 240 240"
      style={{ overflow: "visible" }}
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 88;
        const y = Math.sin(a) * 88;
        return (
          <g key={i}>
            <line
              x1="0"
              y1="0"
              x2={x}
              y2={y}
              stroke="var(--rule)"
              strokeWidth="0.8"
            />
            <circle
              cx={x}
              cy={y}
              r="6"
              fill="var(--paper)"
              stroke="var(--moss)"
              strokeWidth="1.2"
            />
          </g>
        );
      })}
      <circle cx="0" cy="0" r="22" fill="var(--ink)" />
      <text
        x="0"
        y="4"
        textAnchor="middle"
        fontFamily="JetBrains Mono, ui-monospace, monospace"
        fontSize="9"
        letterSpacing="1.5"
        fill="var(--paper)"
      >
        {label}
      </text>
    </svg>
  );
}
