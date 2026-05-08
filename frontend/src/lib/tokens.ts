// Canonical design tokens — extracted verbatim from
// docs/design/design_handoff_ccm_network/design_reference/CCM Network - BI & Site.html
// (window.__BI_PALETTES). DO NOT drift; this is the single source of truth.

export type Theme = "light" | "dark";

export type Tokens = {
  paper: string;
  paperDeep: string;
  ink: string;
  inkSoft: string;
  moss: string;
  moss2: string;
  clay: string;
  sky: string;
  rule: string;
};

export const lightTokens: Tokens = {
  paper: "#f5f3ec",
  paperDeep: "#ebe8de",
  ink: "#0c0f10",
  inkSoft: "#3a3f3c",
  moss: "#2dbf63",
  moss2: "#5fe089",
  clay: "#c8602e",
  sky: "#4a7d8c",
  rule: "#c9c5b8",
};

export const darkTokens: Tokens = {
  paper: "#0a0e0c",
  paperDeep: "#060908",
  ink: "#eef1ea",
  inkSoft: "#7a8278",
  // moss / moss2 intentionally identical to light — brand-critical signal color.
  moss: "#2dbf63",
  moss2: "#5fe089",
  clay: "#e88a4e",
  sky: "#7ba9c4",
  rule: "#1a221e",
};

export const getTokens = (theme: Theme): Tokens =>
  theme === "dark" ? darkTokens : lightTokens;
