import { useEffect, useState } from "react";
import {
  type Persona,
  DEV_PERSONA_KEY,
  PERSONA_LABEL,
  canWriteRoute,
  canViewRoute,
  getPersonaForEmail,
} from "./personas";
import { IS_MAINNET } from "./env";

export interface PersonaCtx {
  persona: Persona;
  email: string | null;
  /** True when persona came from a localStorage dev override (testnet). */
  isDev: boolean;
  /** True before /api/me has resolved. */
  loading: boolean;
}

const READ_ONLY_LABEL = PERSONA_LABEL.read_only;
void READ_ONLY_LABEL; // touch to silence unused-import linters in some configs

interface MeResponse {
  email: string | null;
  groups: string[];
  authenticated: boolean;
}

/**
 * Resolves the operator's persona on mount.
 *
 * Mainnet path: hits /api/me (Cloudflare Pages Function), reads the email
 * that CF Access stamped onto the request, looks it up in the persona
 * map.
 *
 * Testnet path: /api/me returns null email → fall back to a localStorage
 * override so devs can flip personas while testing. Default for testnet
 * (no override set) is "treasury" so dev parity isn't broken.
 */
export function usePersona(): PersonaCtx {
  const [ctx, setCtx] = useState<PersonaCtx>({
    persona: "read_only",
    email: null,
    isDev: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let email: string | null = null;
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        if (r.ok) {
          const body = (await r.json()) as MeResponse;
          email = body.email ?? null;
        }
      } catch {
        // Pages Function unreachable — fall through to dev override
      }

      if (cancelled) return;

      // Mainnet: trust CF Access identity
      if (IS_MAINNET) {
        setCtx({
          persona: getPersonaForEmail(email),
          email,
          isDev: false,
          loading: false,
        });
        return;
      }

      // Testnet: no CF Access, use dev override
      let dev: Persona = "super_admin";
      try {
        const stored = localStorage.getItem(DEV_PERSONA_KEY);
        if (
          stored === "super_admin" ||
          stored === "treasury" ||
          stored === "compliance" ||
          stored === "read_only"
        ) {
          dev = stored;
        }
      } catch {/* sandboxed storage */}
      setCtx({ persona: dev, email: email, isDev: true, loading: false });
    })();
    return () => { cancelled = true; };
  }, []);

  return ctx;
}

export function setDevPersona(p: Persona) {
  try {
    localStorage.setItem(DEV_PERSONA_KEY, p);
  } catch {/* ignore */}
  // Force a reload so all hooks re-resolve with the new persona
  window.location.reload();
}

export { canWriteRoute, canViewRoute };
