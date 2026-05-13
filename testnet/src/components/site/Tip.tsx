/**
 * Inline help icon — small "ⓘ" with native browser tooltip on hover.
 * Use next to any technical label to add context for non-expert visitors.
 *
 *   <span>Tonnage <Tip text="..." /></span>
 */
export default function Tip({ text }: { text: string }) {
  return (
    <span
      title={text}
      aria-label={text}
      style={{
        display: "inline-block",
        marginLeft: 4,
        fontSize: 10,
        color: "var(--ink-soft)",
        cursor: "help",
        border: "1px solid var(--rule)",
        borderRadius: "50%",
        width: 12,
        height: 12,
        textAlign: "center",
        lineHeight: "10px",
        verticalAlign: "middle",
      }}
    >
      ?
    </span>
  );
}
