import { lcC, lcMPaths } from "./wordmark-paths";

type Props = {
  /** Height in pixels. Width is auto = size × 2.56 (ratio 256:100). */
  size?: number;
  /** c·c color. Defaults to currentColor (= var(--ink) via CSS). */
  color?: string;
  /** m color. Defaults to var(--moss). */
  mColor?: string;
  className?: string;
  title?: string;
};

/**
 * V1 · ccm — primary wordmark. Custom-drawn lowercase glyphs (NOT Fraunces text).
 * Two ink-colored c's (x = 46, 116) + a moss-colored m (x = 158).
 * Single-word lockup; m sits attached. Geometry is tuned — do not reinterpret.
 */
export default function Wordmark({
  size = 96,
  color = "currentColor",
  mColor,
  className,
  title = "ccm",
}: Props) {
  const r = 28;
  const s = 10;
  const yC = 50;
  const mX = 158;
  const mPaths = lcMPaths(mX, yC, r, s);
  const moss = mColor ?? "var(--moss)";
  return (
    <svg
      width={size * 2.56}
      height={size}
      viewBox="0 0 256 100"
      role="img"
      aria-label={title}
      className={className}
      style={{ overflow: "visible" }}
    >
      <title>{title}</title>
      <path d={lcC(46, yC, r, s)} fill={color} />
      <path d={lcC(116, yC, r, s)} fill={color} />
      <g fill={moss}>
        {mPaths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
