import { type Persona, PERSONA_LABEL } from "../../lib/personas";

/**
 * Renders a clay-colored banner explaining that the current persona
 * cannot write on this page. Form CTAs should also be disabled —
 * this component is the user-facing explanation.
 */
export default function ReadOnlyBanner({
  persona,
  email,
  pageLabel,
}: {
  persona: Persona;
  email?: string | null;
  pageLabel: string;
}) {
  return (
    <div
      className="border px-5 py-4 flex items-start gap-4 flex-wrap"
      style={{ background: "rgba(200,96,46,0.08)", borderColor: "var(--clay)" }}
    >
      <span
        className="font-mono text-[10px] tracking-[0.18em] uppercase px-2 py-1 border shrink-0"
        style={{ borderColor: "var(--clay)", color: "var(--clay)", fontWeight: 600 }}
      >
        Read-only
      </span>
      <div style={{ color: "var(--ink)", fontSize: 13, lineHeight: 1.55 }}>
        Your persona <strong>{PERSONA_LABEL[persona]}</strong>
        {email && <> ({email})</>} can view this {pageLabel} page but cannot
        perform write actions. CTA buttons are disabled. To request a
        persona change, contact the operations admin.
      </div>
    </div>
  );
}
