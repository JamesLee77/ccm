import { useState } from "react";
import { type PersonaCtx, setDevPersona } from "../../lib/usePersona";
import { type Persona, PERSONA_LABEL } from "../../lib/personas";

const PERSONA_COLOR: Record<Persona, string> = {
  super_admin: "var(--ink)",    // founder = full ink
  treasury: "var(--clay)",      // money-moving = warm
  compliance: "var(--moss)",    // ops = green
  read_only: "var(--ink-soft)", // muted
};

/**
 * Header badge that shows the current operator's persona and email.
 *
 * On mainnet (CF Access): shows "Treasury · cogo0@cogo.xyz" — read-only.
 * On testnet (no CF Access): also acts as a persona switcher dropdown so
 * devs can test all 3 modes without redeploying.
 */
export default function PersonaBadge({ ctx }: { ctx: PersonaCtx }) {
  const [open, setOpen] = useState(false);
  const color = PERSONA_COLOR[ctx.persona];
  const label = PERSONA_LABEL[ctx.persona];

  if (ctx.loading) {
    return (
      <span
        className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
        style={{ borderColor: "var(--rule)", color: "var(--ink-soft)" }}
      >
        ⋯
      </span>
    );
  }

  // Static (mainnet, prod identity)
  if (!ctx.isDev) {
    return (
      <span
        className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border"
        style={{ borderColor: color, color, background: `color-mix(in srgb, ${color} 8%, transparent)` }}
        title={ctx.email ? `${label} · ${ctx.email}` : label}
      >
        {label}
        {ctx.email && (
          <span style={{ color: "var(--ink-soft)", marginLeft: 6, textTransform: "none" }}>
            {ctx.email.split("@")[0]}
          </span>
        )}
      </span>
    );
  }

  // Switcher (testnet only)
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-[10px] tracking-[0.14em] uppercase px-2 py-1 border hover:opacity-80"
        style={{
          borderColor: color,
          color,
          background: `color-mix(in srgb, ${color} 8%, transparent)`,
        }}
        title="Dev persona switcher (testnet only)"
      >
        {label} <span style={{ color: "var(--ink-soft)", marginLeft: 4 }}>▼</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 border shadow-lg z-20 min-w-[200px]"
          style={{ background: "var(--paper)", borderColor: "var(--rule)" }}
        >
          <div
            className="font-mono text-[9px] tracking-[0.16em] uppercase px-3 py-2 border-b"
            style={{ color: "var(--ink-soft)", borderColor: "var(--rule)" }}
          >
            Dev persona (testnet)
          </div>
          {(["super_admin", "treasury", "compliance", "read_only"] as Persona[]).map((p) => (
            <button
              key={p}
              onClick={() => setDevPersona(p)}
              className="block w-full text-left px-3 py-2 font-mono text-[11px] hover:bg-paper-deep"
              style={{
                background: ctx.persona === p ? "var(--paper-deep)" : "transparent",
                color: PERSONA_COLOR[p],
              }}
            >
              {ctx.persona === p ? "✓ " : "  "}
              {PERSONA_LABEL[p]}
            </button>
          ))}
          <div
            className="font-mono text-[9px] px-3 py-2 border-t"
            style={{ color: "var(--ink-soft)", borderColor: "var(--rule)" }}
          >
            mainnet uses CF Access — no switcher
          </div>
        </div>
      )}
    </div>
  );
}
