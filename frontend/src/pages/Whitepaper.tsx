import { useEffect, useState } from "react";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Diagrams — schematic SVGs that explain the section's central concept.
// All use stroke=currentColor; parent's color drives the moss accent.
// ---------------------------------------------------------------------------

function FigureFrame({
  caption,
  children,
}: {
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure
      className="border border-rule"
      style={{
        background: "var(--paper-deep)",
        margin: "32px 0 8px",
        padding: "24px 24px 18px",
      }}
    >
      <div className="flex justify-center items-center" style={{ minHeight: 200 }}>
        {children}
      </div>
      <figcaption
        className="font-mono text-ink-soft mt-4 pt-3 border-t border-rule"
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
        }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

function TrinityDiagram() {
  return (
    <svg viewBox="0 0 520 240" width="100%" style={{ maxWidth: 540 }}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        className="text-ink"
        style={{ fontFamily: "var(--font-mono, monospace)" }}
      >
        {/* Network — top */}
        <rect x={210} y={20} width={100} height={56} rx={2} />
        <text x={260} y={48} textAnchor="middle" fontSize={11} className="fill-current">
          NETWORK
        </text>
        <text x={260} y={64} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          8-layer protocol
        </text>
        {/* Unit — bottom-left */}
        <rect x={60} y={160} width={100} height={56} rx={2} />
        <text x={110} y={188} textAnchor="middle" fontSize={11} className="fill-current">
          UNIT (CCM)
        </text>
        <text x={110} y={204} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          1 ERC-1155 NFT
        </text>
        {/* Token — bottom-right */}
        <rect x={360} y={160} width={100} height={56} rx={2} />
        <text x={410} y={188} textAnchor="middle" fontSize={11} className="fill-current">
          TOKEN ($CCM)
        </text>
        <text x={410} y={204} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          ERC-20 wrapper
        </text>
        {/* Connections */}
        <line x1={235} y1={76} x2={150} y2={160} />
        <line x1={285} y1={76} x2={370} y2={160} />
        <line x1={160} y1={188} x2={360} y2={188} strokeDasharray="4 3" />
        <text x={200} y={123} fontSize={9} className="fill-current text-moss">
          defines
        </text>
        <text x={302} y={123} fontSize={9} className="fill-current text-moss">
          mints
        </text>
        <text x={235} y={181} fontSize={9} className="fill-current text-moss">
          1:1 wrap
        </text>
      </g>
    </svg>
  );
}

function WrapDiagram() {
  return (
    <svg viewBox="0 0 560 200" width="100%" style={{ maxWidth: 600 }}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        className="text-ink"
      >
        {/* NFT */}
        <rect x={20} y={60} width={140} height={80} rx={2} />
        <text x={90} y={92} textAnchor="middle" fontSize={11} className="fill-current">
          CCM-NFT
        </text>
        <text x={90} y={108} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          ERC-1155
        </text>
        <text x={90} y={122} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          source-of-truth
        </text>
        {/* Vault */}
        <rect x={210} y={50} width={140} height={100} rx={2} />
        <text x={280} y={86} textAnchor="middle" fontSize={11} className="fill-current text-moss">
          VAULT
        </text>
        <text x={280} y={104} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          non-custodial
        </text>
        <text x={280} y={118} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          1:1 invariant
        </text>
        <text x={280} y={132} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          FIFR redemption
        </text>
        {/* Token */}
        <rect x={400} y={60} width={140} height={80} rx={2} />
        <text x={470} y={92} textAnchor="middle" fontSize={11} className="fill-current">
          $CCM
        </text>
        <text x={470} y={108} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          ERC-20
        </text>
        <text x={470} y={122} textAnchor="middle" fontSize={9} className="fill-current text-ink-soft">
          AMM-ready
        </text>
        {/* Arrows */}
        <line x1={160} y1={92} x2={210} y2={92} />
        <polyline points="200,87 210,92 200,97" />
        <text x={184} y={82} textAnchor="middle" fontSize={9} className="fill-current text-moss">
          wrap
        </text>
        <line x1={210} y1={108} x2={160} y2={108} />
        <polyline points="220,103 210,108 220,113" />
        <text x={184} y={123} textAnchor="middle" fontSize={9} className="fill-current text-moss">
          unwrap
        </text>
        <line x1={350} y1={92} x2={400} y2={92} />
        <polyline points="390,87 400,92 390,97" />
        <line x1={400} y1={108} x2={350} y2={108} />
        <polyline points="410,103 400,108 410,113" />
      </g>
    </svg>
  );
}

function StackDiagram() {
  const layers = [
    { id: "L1", title: "Standard", note: "IPCC-aligned methodologies" },
    { id: "L2", title: "MRV", note: "physical measurement, oracle ingest" },
    { id: "L3", title: "Oracle", note: "Chainlink + custom feeds" },
    { id: "L4", title: "VVB Consensus", note: "M-of-N attestation" },
    { id: "L5", title: "NFT Registry", note: "ERC-1155, source-of-truth" },
    { id: "L6", title: "Token Wrapper", note: "ERC-20, fungible $CCM" },
    { id: "L7", title: "DeFi", note: "8 primitives, composable" },
    { id: "L8", title: "Application", note: "marketplace, retire UX" },
  ];
  return (
    <svg viewBox="0 0 540 360" width="100%" style={{ maxWidth: 560 }}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        className="text-ink"
      >
        {layers.map((l, i) => {
          const y = 12 + i * 40;
          const isApex = i === layers.length - 1;
          return (
            <g key={l.id}>
              <rect
                x={40}
                y={y}
                width={460}
                height={32}
                rx={1}
                className={isApex ? "text-moss" : ""}
              />
              <text x={56} y={y + 21} fontSize={11} className="fill-current text-moss">
                {l.id}
              </text>
              <text x={92} y={y + 21} fontSize={11} className="fill-current">
                {l.title}
              </text>
              <text x={210} y={y + 21} fontSize={10} className="fill-current text-ink-soft">
                {l.note}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function IssuanceFlow() {
  const steps = [
    { n: "01", label: "Project" },
    { n: "02", label: "MRV capture" },
    { n: "03", label: "Oracle attest" },
    { n: "04", label: "VVB sign (M/N)" },
    { n: "05", label: "NFT mint" },
  ];
  return (
    <svg viewBox="0 0 600 160" width="100%" style={{ maxWidth: 620 }}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        className="text-ink"
      >
        {steps.map((s, i) => {
          const x = 20 + i * 116;
          return (
            <g key={s.n}>
              <rect x={x} y={50} width={92} height={62} rx={2} />
              <text x={x + 46} y={75} textAnchor="middle" fontSize={11} className="fill-current text-moss">
                {s.n}
              </text>
              <text x={x + 46} y={94} textAnchor="middle" fontSize={10} className="fill-current">
                {s.label}
              </text>
              {i < steps.length - 1 ? (
                <g>
                  <line x1={x + 92} y1={81} x2={x + 116} y2={81} />
                  <polyline points={`${x + 110},76 ${x + 116},81 ${x + 110},86`} />
                </g>
              ) : null}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function AllocationChart() {
  const allocs = [
    { label: "Mining", pct: 40, color: "var(--moss)" },
    { label: "Foundation", pct: 18, color: "currentColor" },
    { label: "Strategic", pct: 10, color: "currentColor" },
    { label: "Liquidity", pct: 9, color: "currentColor" },
    { label: "Treasury", pct: 8, color: "currentColor" },
    { label: "Public Sale", pct: 5, color: "currentColor" },
    { label: "Staking", pct: 5, color: "currentColor" },
    { label: "Team", pct: 5, color: "currentColor" },
  ];
  let acc = 0;
  return (
    <svg viewBox="0 0 600 160" width="100%" style={{ maxWidth: 620 }}>
      <g className="text-ink">
        <rect x={20} y={48} width={560} height={28} fill="none" stroke="currentColor" strokeWidth={1.2} />
        {allocs.map((a) => {
          const x = 20 + (acc / 100) * 560;
          const w = (a.pct / 100) * 560;
          acc += a.pct;
          const isMining = a.label === "Mining";
          return (
            <g key={a.label}>
              <rect
                x={x + 0.5}
                y={48.5}
                width={Math.max(0, w - 1)}
                height={27}
                fill={isMining ? "var(--moss)" : "var(--ink-soft)"}
                opacity={isMining ? 0.85 : 0.18}
                stroke="none"
              />
              <line
                x1={x}
                y1={48}
                x2={x}
                y2={84}
                stroke="currentColor"
                strokeWidth={0.8}
              />
              <text
                x={x + 4}
                y={100}
                fontSize={9}
                className="fill-current text-ink-soft"
              >
                {a.pct}%
              </text>
              <text
                x={x + 4}
                y={112}
                fontSize={9}
                className="fill-current"
              >
                {a.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function PrimitivesGrid() {
  const items = [
    "7.2 Wrap / Unwrap",
    "7.3 Grade Wrappers",
    "7.4 Vault Lending",
    "7.5 Fractionalization",
    "7.6 NFT Yield",
    "7.7 Retire-to-Earn",
    "7.8 Insurance Vault",
    "7.9 Index Baskets",
  ];
  return (
    <svg viewBox="0 0 600 200" width="100%" style={{ maxWidth: 620 }}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        className="text-ink"
      >
        {items.map((it, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const x = 12 + col * 146;
          const y = 16 + row * 86;
          const [num, ...rest] = it.split(" ");
          const label = rest.join(" ");
          return (
            <g key={it}>
              <rect x={x} y={y} width={140} height={70} rx={1} />
              <text x={x + 12} y={y + 24} fontSize={10} className="fill-current text-moss">
                §&nbsp;{num}
              </text>
              <text x={x + 12} y={y + 50} fontSize={11} className="fill-current">
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function PhaseTimeline() {
  const phases = [
    { id: "P0", label: "Foundation", q: "shipped" },
    { id: "P1", label: "TGE + Listing", q: "2026 Q3–Q4" },
    { id: "P2", label: "Mainnet & MRV", q: "2027" },
    { id: "P3", label: "Composability", q: "2028" },
    { id: "P4", label: "Institutional", q: "2029" },
    { id: "P5", label: "Article 6", q: "2030+" },
  ];
  return (
    <svg viewBox="0 0 600 160" width="100%" style={{ maxWidth: 620 }}>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        className="text-ink"
      >
        <line x1={30} y1={70} x2={570} y2={70} />
        {phases.map((p, i) => {
          const x = 30 + (i * 540) / (phases.length - 1);
          const isCurrent = i === 1;
          return (
            <g key={p.id}>
              <circle
                cx={x}
                cy={70}
                r={5}
                fill={i === 0 ? "var(--moss)" : "var(--paper-deep)"}
                stroke={isCurrent ? "var(--moss)" : "currentColor"}
                strokeWidth={isCurrent ? 1.6 : 1}
              />
              <text
                x={x}
                y={50}
                textAnchor="middle"
                fontSize={10}
                className="fill-current text-moss"
              >
                {p.id}
              </text>
              <text
                x={x}
                y={92}
                textAnchor="middle"
                fontSize={10}
                className="fill-current"
              >
                {p.label}
              </text>
              <text
                x={x}
                y={106}
                textAnchor="middle"
                fontSize={9}
                className="fill-current text-ink-soft"
              >
                {p.q}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

function GradingTable() {
  const rows = [
    ["A", "Direct Air Capture · Mineralization", "1,000+ yr", "5-of-7"],
    ["B", "Biochar · Enhanced Weathering", "100+ yr", "4-of-6"],
    ["C", "Reforestation · Soil carbon", "40+ yr", "4-of-6"],
    ["D", "REDD+ · Legacy methodologies", "10–40 yr", "3-of-5"],
  ];
  return (
    <div
      className="border border-rule overflow-x-auto"
      style={{ background: "var(--paper-deep)", margin: "32px 0 8px" }}
    >
      <table
        className="w-full font-mono text-ink"
        style={{ fontSize: 13, borderCollapse: "collapse", minWidth: 540 }}
      >
        <thead>
          <tr className="text-moss" style={{ borderBottom: "1px solid var(--rule)" }}>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>
              Grade
            </th>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>
              Category
            </th>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>
              Permanence
            </th>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>
              VVB
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              style={{
                borderBottom:
                  i < rows.length - 1 ? "1px solid var(--rule)" : "none",
              }}
            >
              {r.map((cell, j) => (
                <td
                  key={j}
                  style={{ padding: "12px 16px" }}
                  className={
                    j === 0
                      ? "text-moss"
                      : j === 1
                      ? "text-ink"
                      : "text-ink-soft"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RisksTable() {
  const rows = [
    [
      "Regulatory",
      "Token classification across jurisdictions",
      "ADGM/BVI entity, per-round KYC, external counsel",
    ],
    [
      "Verification",
      "Faulty/dishonest VVB attestations",
      "Stake-slash, M-of-N, ZK-proof, dispute, Insurance Vault",
    ],
    [
      "Market",
      "Token volatility, VCM credibility crises",
      "Grading, retire monitoring, buy-back-and-burn",
    ],
    [
      "Technical",
      "Smart-contract bugs, oracle manipulation",
      "Multi-audit, Immunefi, non-upgradeable, Chainlink TWAP",
    ],
    [
      "DeFi",
      "Liquidation cascade, index oracle manipulation",
      "Conservative LTV, Dutch auction, TWAP, basket timelock",
    ],
    [
      "Adoption",
      "Verra/Gold Standard registry lock-in",
      "Interop mapping, ICVCM CCP alignment, pilot incentives",
    ],
  ];
  return (
    <div
      className="border border-rule overflow-x-auto"
      style={{ background: "var(--paper-deep)", margin: "32px 0 8px" }}
    >
      <table
        className="w-full font-mono text-ink"
        style={{ fontSize: 12.5, borderCollapse: "collapse", minWidth: 640 }}
      >
        <thead>
          <tr className="text-moss" style={{ borderBottom: "1px solid var(--rule)" }}>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, width: 140 }}>
              Domain
            </th>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>
              Risk
            </th>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>
              Mitigation
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              style={{
                borderBottom:
                  i < rows.length - 1 ? "1px solid var(--rule)" : "none",
                verticalAlign: "top",
              }}
            >
              <td style={{ padding: "14px 16px" }} className="text-moss">
                {r[0]}
              </td>
              <td style={{ padding: "14px 16px" }} className="text-ink">
                {r[1]}
              </td>
              <td style={{ padding: "14px 16px" }} className="text-ink-soft">
                {r[2]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AllocationTable() {
  const rows = [
    ["Mining Rewards", "40%", "2.0B", "10-year decelerating emission"],
    ["Foundation", "18%", "900M", "4Y vesting + 1Y cliff"],
    ["Strategic / Partners", "10%", "500M", "4Y vesting + 1Y cliff"],
    ["Liquidity / AMM", "9%", "450M", "Unlocked at TGE"],
    ["Treasury", "8%", "400M", "DAO-controlled"],
    ["Public Sale (TGE)", "5%", "250M", "Seed + Series A"],
    ["Staking Pool", "5%", "250M", "Price-elastic yield"],
    ["Team & Advisors", "5%", "250M", "4Y vesting + 1Y cliff"],
  ];
  return (
    <div
      className="border border-rule overflow-x-auto"
      style={{ background: "var(--paper-deep)", margin: "32px 0 8px" }}
    >
      <table
        className="w-full font-mono text-ink"
        style={{ fontSize: 12.5, borderCollapse: "collapse", minWidth: 600 }}
      >
        <thead>
          <tr className="text-moss" style={{ borderBottom: "1px solid var(--rule)" }}>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>
              Category
            </th>
            <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, width: 70 }}>
              %
            </th>
            <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500, width: 90 }}>
              Tokens
            </th>
            <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              style={{
                borderBottom:
                  i < rows.length - 1 ? "1px solid var(--rule)" : "none",
              }}
            >
              <td style={{ padding: "12px 16px" }} className="text-ink">
                {r[0]}
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right" }} className="text-moss">
                {r[1]}
              </td>
              <td
                style={{ padding: "12px 16px", textAlign: "right" }}
                className="text-ink"
              >
                {r[2]}
              </td>
              <td style={{ padding: "12px 16px" }} className="text-ink-soft">
                {r[3]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections — body now structured with headings, paragraphs, callouts, figures.
// ---------------------------------------------------------------------------

type Section = {
  num: string;
  id: string;
  title: string;
  body: ReactNode;
};

const SECTIONS: Section[] = [
  {
    num: "1",
    id: "unit",
    title: "The unit",
    body: (
      <>
        <p>
          CCM is a unit of measurement: 1 CCM equals one tonne of CO₂-equivalent,
          verified once and retired once. The CCM Network is the onchain
          infrastructure that lets that unit travel — issuance, grading,
          custody, settlement, retirement — without the meaning of the unit
          drifting in any of those steps.
        </p>
        <p>
          Three things share one logic. The Network is an eight-layer protocol;
          the CCM is a single ERC-1155 NFT carrying vintage, grade, project ID,
          and a multi-VVB consensus signature; the $CCM is the ERC-20 wrapper
          that exists 1:1 with NFTs in a non-custodial vault.
        </p>
        <p>
          Source-of-truth lives on the NFT side; liquidity lives on the token
          side; the wrap is the bridge. This separation is the central
          architectural decision of this paper. Most prior onchain carbon
          systems collapse the two sides into a single fungible asset and lose
          provenance; the CCM specification preserves both simultaneously.
        </p>
        <p>
          The remainder of the document defines what each of these is, how the
          system maintains the 1:1 invariant under adversarial conditions, and
          how the resulting unit composes with general-purpose DeFi primitives
          from day one.
        </p>
        <FigureFrame caption="Figure 1.1 — The trinity. Network defines the standard, the unit (NFT) is minted under it, the token is the fungible 1:1 wrapper.">
          <TrinityDiagram />
        </FigureFrame>
      </>
    ),
  },
  {
    num: "2",
    id: "problem",
    title: "What broke",
    body: (
      <>
        <p>
          The voluntary carbon market projects to roughly $250B by 2050 per
          McKinsey, with corroborating estimates from the World Bank and IPCC.
          That trajectory assumes four structural failures get fixed first.
        </p>
        <p>
          <strong className="text-ink">Opacity.</strong> Provenance is lost in
          PDF registries traded by phone. There is no canonical machine-readable
          record of what is owned, by whom, or against which mitigation
          activity. Auditors reconstruct chains from spreadsheets.
        </p>
        <p>
          <strong className="text-ink">Double-counting.</strong> The same tonne
          can be claimed across registries with no shared ledger to reject the
          duplicate. A 2023 Guardian/SourceMaterial investigation found
          ~94 million Verra rainforest credits were "phantom" — not associated
          with real reductions. The systemic flaw is registry isolation.
        </p>
        <p>
          <strong className="text-ink">Illiquidity.</strong> Long settlement
          (T+5 to T+30), fragmented brokers, and no native price discovery
          force corporate buyers into bilateral negotiation for every tranche.
        </p>
        <p>
          <strong className="text-ink">No grading.</strong> A nature-based
          credit with 30-year permanence prices identically to a Direct Air
          Capture tonne with 1,000-year permanence in most markets. Quality
          signal collapses into a single price.
        </p>
        <p className="text-ink-soft">
          Each failure is a coordination problem. The fix is a public ledger,
          a public grade, and a public price — all enforced at the protocol
          level rather than asked of intermediaries.
        </p>
      </>
    ),
  },
  {
    num: "3",
    id: "dual",
    title: "Dual representation",
    body: (
      <>
        <p>
          Every CCM exists in one of two forms: an ERC-1155 NFT
          (source-of-truth) or an ERC-20 $CCM (AMM-ready). The wrap is 1:1,
          non-custodial, reversible. There is no bridge, no synthetic, no
          custodial float.
        </p>
        <p>
          The NFT carries vintage, grade, project ID, methodology version, and
          the M-of-N VVB consensus signature in its metadata. It is the
          authoritative record of one tonne. The $CCM is fungible — it composes
          into Uniswap, Curve, Aave, Pendle, OpenSea, Sudoswap from day one
          using their existing token interfaces.
        </p>
        <p>
          The vault is the only source of truth and enforces a 1:1 backing
          invariant in the contract: <code className="font-mono text-ink">
          totalSupply($CCM) ≤ Σ vault.NFTs.tonnes</code>. The mint and burn
          functions on $CCM are gated by NFT deposit and withdrawal; no
          privileged minter exists.
        </p>
        <FigureFrame caption="Figure 3.1 — The wrap. Non-custodial vault holds NFTs as collateral; $CCM mints on deposit, burns on withdrawal.">
          <WrapDiagram />
        </FigureFrame>
        <p>
          Self-correcting quality (FIFR — first-in first-redeemed) ensures
          unwrap delivers the lowest-grade NFTs first. Without this, the
          floating $CCM pool would degrade in expected quality over time as
          high-grade holders unwrap selectively. FIFR keeps the pool's
          mean grade rising as cheap inventory leaves first.
        </p>
        <p>
          The grade-wrapper variant ($CCM-A, $CCM-B, $CCM-C, $CCM-D) is a
          mechanical extension: each grade has its own vault and its own
          ERC-20. Buyers who want only DAC tonnes wrap into $CCM-A and never
          touch the blended pool.
        </p>
      </>
    ),
  },
  {
    num: "4",
    id: "grading",
    title: "Grading",
    body: (
      <>
        <p>
          Not all tonnes are equal. The standard makes that explicit with four
          grades, defined by permanence (the half-life of the carbon claim
          under realistic reversal scenarios) and by the strictness of the
          required VVB consensus.
        </p>
        <GradingTable />
        <p style={{ marginTop: 16 }}>
          Permanence thresholds are derived from IPCC AR6 storage-medium
          half-lives. VVB consensus requirements scale inversely — the longer
          the claimed permanence, the stricter the multi-attestor threshold,
          because reversal is harder to detect after the fact.
        </p>
        <p>
          Grade is set at issuance and is immutable. It is encoded in the
          NFT's metadata and cannot be changed by trade or transfer. The
          grade-wrapper system (§3) means each tier has its own AMM pair and
          discovers its own price independently.
        </p>
        <p>
          A natural question is whether grades will commodify the existing
          quality dispersion. They will. A blended-pool token (e.g. BCT)
          masks quality differences inside a single price; the grade system
          surfaces them. We expect a 3-5× permanent price spread between
          Grade A and Grade D credits at steady state.
        </p>
      </>
    ),
  },
  {
    num: "5",
    id: "architecture",
    title: "Architecture",
    body: (
      <>
        <p>
          Eight layers, separated concerns. Each layer has a single
          responsibility and a stable contract with the layers above and below.
          The eighth layer (application) can ship and iterate without
          modifying the underlying registry; the registry can be audited
          independently of the DeFi composition layer.
        </p>
        <FigureFrame caption="Figure 5.1 — The 8-layer stack. L1 defines the standard; L8 is consumer-facing UX.">
          <StackDiagram />
        </FigureFrame>
        <p>
          Nineteen smart-contract modules implement L4–L7. They include
          issuance, vault, grading, dispute, insurance, governance, and the
          eight DeFi primitives. All modules are non-upgradeable post-audit;
          oracle prices use Chainlink TWAP with a 30-minute window;
          cross-cutting risks are reported under §10.
        </p>
        <p>
          The contract surface is intentionally narrow. The vault has fewer
          than 600 lines of Solidity. The grading contract is parameter-only
          (no mutable logic). The DeFi primitives are independent contracts
          that read from the vault but cannot write to it. This makes the
          base layer auditable in days, not weeks.
        </p>
        <p>
          External composability is achieved by exposing only standard
          interfaces (ERC-20, ERC-1155, ERC-4626 for the staking vault).
          No custom integrations are required for top-10 DEX/lending protocol
          inclusion.
        </p>
      </>
    ),
  },
  {
    num: "6",
    id: "ccmine",
    title: "CCMine — proof of carbon removal/reduction",
    body: (
      <>
        <p>
          Bitcoin's proof-of-work hash is replaced by verifiable reduction
          activity as the issuance unit. We call this scheme Proof of Carbon
          Removal/Reduction (PoCR). The hash a miner submits is not a nonce —
          it is a cryptographic commitment to a measured tonne of CO₂e
          reduced or removed, signed by an oracle and a quorum of VVBs.
        </p>
        <FigureFrame caption="Figure 6.1 — Issuance flow. Five gated steps from project to mint; each step is recorded and slashable.">
          <IssuanceFlow />
        </FigureFrame>
        <p>
          Step 1 — a registered project initiates an issuance request with
          methodology and expected tonnage. Step 2 — MRV hardware (sensors,
          satellite, hardware oracles) captures physical evidence and emits a
          signed reading. Step 3 — the oracle network attests to the reading's
          inclusion and freshness. Step 4 — VVBs sign the resulting issuance
          claim under M-of-N consensus (M and N depend on grade). Step 5 —
          the NFT mints with full provenance.
        </p>
        <p>
          Three operator paths exist: project nodes (origination), oracle nodes
          (data attestation), and VVB nodes (consensus signing). Each requires
          a $CCM stake. Stake size and slashing conditions are tuned per role
          — VVBs are slashed for falsified attestations, oracle nodes for
          stale or inconsistent data, project nodes for methodology violations.
        </p>
        <p>
          The miner reward is in $CCM, paid from the 40% allocation reserved
          for mining (see §7). The reward decelerates over a 10-year curve;
          early-network operators earn a higher per-tonne rate, equilibrating
          to a long-run rate sustainable from issuance fees alone.
        </p>
      </>
    ),
  },
  {
    num: "7",
    id: "tokenomics",
    title: "Tokenomics",
    body: (
      <>
        <p>
          5,000,000,000 hard cap. ERC20Capped is enforced at the contract
          level — no mint function survives deployment. The cap is a
          constructor parameter, not a configurable variable.
        </p>
        <FigureFrame caption="Figure 7.1 — Allocation. Mining is the largest single allocation at 40%, paid out over a 10-year emission curve.">
          <AllocationChart />
        </FigureFrame>
        <AllocationTable />
        <p style={{ marginTop: 16 }}>
          Five utility paths drive demand for $CCM:
        </p>
        <ol
          style={{
            paddingLeft: 24,
            margin: "8px 0 16px",
            display: "grid",
            gap: 6,
          }}
        >
          <li>Settlement currency for marketplace and OTC desk.</li>
          <li>VVB and CCMiner staking (slash-protected).</li>
          <li>
            Governance via veCCM lock-and-vote (4-year max lock, vote
            weight scales with lock duration).
          </li>
          <li>50% marketplace fee discount for $CCM payers.</li>
          <li>
            DeFi liquidity primitive across the eight composability surfaces
            (§8).
          </li>
        </ol>
        <p>
          Buy-back-and-burn closes the value-accrual loop. A fraction of
          marketplace fees and DeFi protocol revenue routes to the treasury,
          which executes timelocked open-market buys and burns, producing
          permanent supply contraction proportional to network throughput.
        </p>
      </>
    ),
  },
  {
    num: "8",
    id: "defi",
    title: "DeFi composability",
    body: (
      <>
        <p>
          Eight primitives, composable from day one. All standard ERC-20 /
          ERC-1155 — no proprietary interfaces, no per-protocol integrations
          required.
        </p>
        <FigureFrame caption="Figure 8.1 — The eight primitives, indexed by section in the long-form DeFi page.">
          <PrimitivesGrid />
        </FigureFrame>
        <p>
          §7.2 <strong className="text-ink">Wrap/Unwrap</strong> — NFT ⇆ $CCM
          1:1 with FIFR self-correction. §7.3 <strong className="text-ink">
          Grade Wrappers</strong> — $CCM-A/B/C/D for per-grade discovery.
          §7.4 <strong className="text-ink">Vault Lending</strong> — NFT
          collateral for USDC, grade-tiered LTV 30–70%. §7.5 <strong className="text-ink">
          Fractionalization</strong> — split a 10K-tonne NFT into 10K
          fractionals.
        </p>
        <p>
          §7.6 <strong className="text-ink">NFT Yield</strong> — hold-to-earn
          weighted by grade and vintage. §7.7 <strong className="text-ink">
          Retire-to-Earn</strong> — 0–10% $CCM rebate on ESG retire.
          §7.8 <strong className="text-ink">Insurance Vault</strong> —
          auto-payout on VVB validation failure. §7.9 <strong className="text-ink">
          Index Baskets</strong> — $CCM-PRIME, $CCM-FOREST, $CCM-TECH.
        </p>
        <p>
          The depth of treatment for each primitive is in the dedicated DeFi
          page (<a href="/defi" className="text-moss hover:underline">/defi</a>),
          which includes worked examples, external protocol mappings, and live
          status targets.
        </p>
      </>
    ),
  },
  {
    num: "9",
    id: "roadmap",
    title: "Roadmap",
    body: (
      <>
        <p>
          Six phases, one instrument. Each phase has explicit deliverables and
          a measurable execution metric. Phase 0 (Foundation) and P1 (TGE plus
          CEX/DEX listing, 2026 Q3–Q4) are scheduled in the near term; later
          phases scale toward UNFCCC Article 6 alignment by the end of the
          decade.
        </p>
        <FigureFrame caption="Figure 9.1 — Phase timeline. P1 (TGE + listings) is the next checkpoint after foundation.">
          <PhaseTimeline />
        </FigureFrame>
        <p>
          The full milestone ledger and gantt are visible on the
          home page (<a href="/roadmap" className="text-moss hover:underline">
          §11 Roadmap</a>); this section keeps the document-level summary
          intentionally short.
        </p>
        <p>
          Phase ordering is not arbitrary. Foundation work (P0) gates
          everything else; mainnet and MRV (P2) gate composability (P3);
          institutional rails (P4) gate the Article 6 jurisdictional path
          (P5). Each gate is a hard prerequisite, not a soft preference.
        </p>
      </>
    ),
  },
  {
    num: "10",
    id: "risks",
    title: "Risks",
    body: (
      <>
        <p>
          Transparency starts with disclosing risk. Six domains, each rated
          and mitigated at the protocol or treasury level.
        </p>
        <RisksTable />
        <p style={{ marginTop: 16 }}>
          The Insurance Vault is the centerpiece of the verification-failure
          case. Funded by a 5% slice of issuance fees and a portion of DeFi
          protocol revenue, it pays out NFT holders pro-rata when an
          attestation is later invalidated by dispute or methodology revision.
          This is the structural answer to the Verra-style "phantom credit"
          failure mode.
        </p>
        <p>
          The defense-in-depth pattern repeats across domains: stake-slash for
          attestor risk, audit-plus-bounty for technical risk, conservative
          LTV plus auctions for DeFi risk, conservative entity setup for
          regulatory risk. None of these are silver bullets; together they
          compose into a survivable risk profile.
        </p>
      </>
    ),
  },
];

const REFERENCES = [
  "McKinsey & Company. A blueprint for scaling voluntary carbon markets to meet the climate challenge. 2021.",
  "World Bank. State and Trends of Carbon Pricing. 2024.",
  "IPCC. AR6 Synthesis Report: Climate Change. 2023.",
  "ICVCM. Core Carbon Principles (CCPs). 2024.",
  "NOAA. Mauna Loa CO₂ Record. 2026.",
  "Guardian / SourceMaterial. Verra rainforest carbon credits investigation. 2023.",
  "Chainlink. Time-Weighted Average Price (TWAP) oracle specification. 2023.",
  "EIP-1155 / EIP-20 / EIP-4626. Ethereum token standards.",
];

// ---------------------------------------------------------------------------
// Scroll-spy
// ---------------------------------------------------------------------------

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? "");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Whitepaper() {
  const ids = SECTIONS.map((s) => s.id);
  const active = useScrollSpy(ids);

  return (
    <article>
      {/* Document header */}
      <header
        className="border-b border-rule px-6 md:px-14"
        style={{ paddingTop: 80, paddingBottom: 56 }}
      >
        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-6">
          CCM Foundation · Whitepaper v1.0 · May 2026
        </div>
        <h1
          className="font-display"
          style={{
            fontWeight: 300,
            fontSize: "clamp(40px, 7vw, 96px)",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          Carbon credits,{" "}
          <em className="italic-moss">measured by physics.</em>
        </h1>
        <p
          className="font-body text-ink-soft mt-8 max-w-[760px]"
          style={{ fontSize: 18, lineHeight: 1.55 }}
        >
          A specification for an onchain carbon-credit standard, dual-form
          token, eight-layer network, and DeFi-native marketplace.
        </p>
      </header>

      {/* Abstract */}
      <section className="border-b border-rule px-6 md:px-14 py-16">
        <div className="grid gap-10 md:grid-cols-[200px_1fr] md:gap-16">
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss">
            Abstract
          </div>
          <div
            className="font-body text-ink"
            style={{ fontSize: 17, lineHeight: 1.65, maxWidth: 720 }}
          >
            <p>
              CCM defines one tonne of CO₂-equivalent as a unit (1 CCM = 1
              tCO₂e), issued onchain as an ERC-1155 NFT with vintage, grade,
              and provenance, and wrappable 1:1 into an ERC-20 $CCM for
              liquidity.
            </p>
            <p style={{ marginTop: 14 }}>
              Issuance is gated by a multi-VVB consensus, mining is replaced
              with a Proof of Carbon Removal/Reduction scheme, and the result
              is a public ledger of verifiable tonnes, grade-aware price
              discovery, and DeFi composability from day one — a single
              instrument the voluntary carbon market has been missing.
            </p>
            <p style={{ marginTop: 14 }}>
              This document specifies the unit, the architecture, the
              mining mechanism, the tokenomics, the DeFi surface, the
              roadmap, and the risk profile. It is the canonical reference
              for the standard; everything else on the network is an
              implementation of what is described here.
            </p>
          </div>
        </div>
      </section>

      {/* Body — TOC + sections */}
      <div className="grid gap-10 md:grid-cols-[220px_1fr] md:gap-16 px-6 md:px-14 py-16">
        {/* TOC */}
        <nav
          aria-label="Table of contents"
          className="md:sticky md:self-start"
          style={{ top: 90 }}
        >
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-4">
            Contents
          </div>
          <ol className="grid gap-2.5 list-none p-0 m-0">
            {SECTIONS.map((s) => (
              <li key={s.id} className="font-mono text-[12px] leading-snug">
                <a
                  href={`#${s.id}`}
                  className={`transition-colors ${
                    active === s.id
                      ? "text-moss"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <span className="tabular-nums opacity-60 mr-2">
                    §&nbsp;{s.num}
                  </span>
                  {s.title}
                </a>
              </li>
            ))}
            <li className="font-mono text-[12px] leading-snug pt-3 mt-3 border-t border-rule">
              <a
                href="#references"
                className="text-ink-soft hover:text-ink transition-colors"
              >
                References
              </a>
            </li>
          </ol>
        </nav>

        {/* Sections */}
        <div className="grid gap-24" style={{ maxWidth: 760 }}>
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} style={{ scrollMarginTop: 90 }}>
              <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3">
                §&nbsp;{s.num}
              </div>
              <h2
                className="font-display"
                style={{
                  fontWeight: 300,
                  fontSize: "clamp(30px, 3.4vw, 44px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                {s.title}
              </h2>
              <div
                className="grid gap-5 mt-7 font-body text-ink-soft"
                style={{ fontSize: 16, lineHeight: 1.7 }}
              >
                {s.body}
              </div>
            </section>
          ))}

          <section id="references" style={{ scrollMarginTop: 90 }}>
            <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-moss mb-3">
              References
            </div>
            <h2
              className="font-display"
              style={{
                fontWeight: 300,
                fontSize: "clamp(30px, 3.4vw, 44px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Sources
            </h2>
            <ol className="grid gap-3 mt-7 list-decimal pl-5">
              {REFERENCES.map((r, i) => (
                <li
                  key={i}
                  className="font-body text-ink-soft"
                  style={{ fontSize: 14, lineHeight: 1.6 }}
                >
                  {r}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </article>
  );
}
