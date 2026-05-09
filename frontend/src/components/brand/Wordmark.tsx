import { useId } from "react";
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
  /**
   * Subtle "mining tick" animation: the m glyph breathes like an active
   * node, and a moss-2 scan sweep periodically passes across the mark
   * (oracle measurement). Respects prefers-reduced-motion. Default true.
   * Keyframes live in index.css under .wm-m / .wm-scan.
   */
  animate?: boolean;
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
  animate = true,
}: Props) {
  const r = 28;
  const s = 10;
  const yC = 50;
  const mX = 158;
  const mPaths = lcMPaths(mX, yC, r, s);
  const moss = mColor ?? "var(--moss)";
  const rid = useId().replace(/:/g, "");
  const maskId = `wm-mask-${rid}`;
  const blurId = `wm-blur-${rid}`;

  const c1 = lcC(46, yC, r, s);
  const c2 = lcC(116, yC, r, s);

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
      {animate ? (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect width="256" height="100" fill="black" />
            <path d={c1} fill="white" />
            <path d={c2} fill="white" />
            {mPaths.map((d, i) => (
              <path key={`mm-${i}`} d={d} fill="white" />
            ))}
          </mask>
          <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
      ) : null}

      {/* Base mark: two c's (gauge frame) + m (active node) */}
      <path d={c1} fill={color} />
      <path d={c2} fill={color} />
      <g fill={moss} className={animate ? "wm-m" : undefined}>
        {mPaths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Scan sweep — oracle measurement / block tick */}
      {animate ? (
        <g
          mask={`url(#${maskId})`}
          filter={`url(#${blurId})`}
          style={{ mixBlendMode: "screen", pointerEvents: "none" }}
        >
          <rect className="wm-scan" y="0" width="14" height="100" fill="var(--moss-2)" />
        </g>
      ) : null}
    </svg>
  );
}
