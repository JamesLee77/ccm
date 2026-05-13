// Wordmark glyph helpers — ported verbatim from
// docs/design/design_handoff_ccm_network/design_reference/brand/bi-system.jsx
//
// "u" = unit; canonical UNIT box is 100u tall × 240u wide.
// x-height: 56u (top 22 → bottom 78), stroke 10u, cap 72u.
// c opening: ~19° half-angle (~38° total) at 4 / 8 o'clock — measurement
// gauge needle metaphor.
// m proportion: bowl rx = 0.78r (narrower than tall), total width ≈ 3.4r.

/**
 * The canonical lowercase c, drawn as a single filled path (no stroke).
 * cx,cy = bowl center; r = outer radius; s = stroke width.
 */
export function lcC(cx: number, cy: number, r: number, s: number): string {
  const ri = r - s;
  const open = 0.34; // opening half-angle in radians ≈ 19°
  const oxA = cx + r * Math.cos(-open);
  const oyA = cy + r * Math.sin(-open);
  const oxB = cx + r * Math.cos(open);
  const oyB = cy + r * Math.sin(open);
  const ixA = cx + ri * Math.cos(-open);
  const iyA = cy + ri * Math.sin(-open);
  const ixB = cx + ri * Math.cos(open);
  const iyB = cy + ri * Math.sin(open);
  // outer arc: A → B going the long way (sweep=0, large=1)
  // inner arc: B → A going short way (sweep=1, large=1)
  return `M ${oxA} ${oyA} A ${r} ${r} 0 1 0 ${oxB} ${oyB} L ${ixB} ${iyB} A ${ri} ${ri} 0 1 1 ${ixA} ${iyA} Z`;
}

/**
 * The lowercase m built from a stem and two bowls — three filled paths.
 * Total width ≈ 4·rx = 3.12r when rx = 0.78r.
 */
export function lcMPaths(x0: number, yC: number, r: number, s: number): string[] {
  const rx = r * 0.78;
  const x1 = x0; // left stem
  const x2 = x0 + rx * 2; // middle stem
  const x3 = x0 + rx * 4; // right stem
  return [
    // left stem
    `M ${x1} ${yC - r} L ${x1 + s} ${yC - r} L ${x1 + s} ${yC + r} L ${x1} ${yC + r} Z`,
    // first bowl shoulder + middle stem
    `M ${x1 + s} ${yC - r} L ${x1 + rx} ${yC - r}
     A ${rx} ${r} 0 0 1 ${x2} ${yC} L ${x2} ${yC + r}
     L ${x2 - s} ${yC + r} L ${x2 - s} ${yC}
     A ${rx - s} ${r - s} 0 0 0 ${x1 + rx} ${yC - r + s}
     L ${x1 + s} ${yC - r + s} Z`,
    // second bowl shoulder + right stem
    `M ${x2} ${yC - r} L ${x2 + rx} ${yC - r}
     A ${rx} ${r} 0 0 1 ${x3} ${yC} L ${x3} ${yC + r}
     L ${x3 - s} ${yC + r} L ${x3 - s} ${yC}
     A ${rx - s} ${r - s} 0 0 0 ${x2 + rx} ${yC - r + s}
     L ${x2} ${yC - r + s} Z`,
  ];
}
