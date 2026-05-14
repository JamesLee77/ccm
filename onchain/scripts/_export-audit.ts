/**
 * Monthly export of admin_audit_log to CSV for compliance archival.
 *
 * Why this exists: the operator console writes to `admin_audit_log` in D1
 * (ccm-portal-db) for every privileged action. The Privacy policy commits
 * to keeping audit rows for 7 years, but D1 storage is best treated as a
 * hot index — long-term we want a tamper-evident CSV trail outside of D1.
 *
 * Usage:
 *   CLOUDFLARE_ACCOUNT_ID=<id> npx ts-node onchain/scripts/_export-audit.ts \
 *     --month=2026-05            # defaults to previous calendar month (UTC)
 *     --db=ccm-portal-db         # defaults to the production D1 binding
 *     --local                    # query the local D1 mirror instead of remote
 *
 * Output: audit-log/<YYYY-MM>.csv (overwritten on rerun). The file sits at
 * the repo root, gitignored — operators are expected to push it to R2 (or
 * another archival store) on a quarterly cadence.
 *
 * Idempotency: re-running for the same month produces the exact same CSV
 * (rows sorted by id, deterministic CSV escaping). Safe to re-run.
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const COLUMNS = [
  "id",
  "wallet",
  "chain_id",
  "action",
  "target_contract",
  "target_address",
  "amount_wei",
  "role_name",
  "tx_hash",
  "status",
  "error_msg",
  "ip_country",
  "user_agent",
  "notes",
  "created_at",
  "updated_at",
] as const;

type Row = Record<(typeof COLUMNS)[number], string | number | null>;

function parseArgs(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith("--")) continue;
    const [k, v] = arg.slice(2).split("=");
    out[k] = v ?? "true";
  }
  return out;
}

function defaultMonth(): string {
  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(month: string): { startSec: number; endSec: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) throw new Error(`invalid --month value: ${month} (expected YYYY-MM)`);
  const year = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) throw new Error(`invalid month number: ${mo}`);
  const startSec = Math.floor(Date.UTC(year, mo - 1, 1) / 1000);
  const endSec = Math.floor(Date.UTC(year, mo, 1) / 1000);
  return { startSec, endSec };
}

function escapeCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function main() {
  const args = parseArgs();
  const month = args.month ?? defaultMonth();
  const dbName = args.db ?? "ccm-portal-db";
  const remote = args.local !== "true";

  const { startSec, endSec } = monthBounds(month);
  const startIso = new Date(startSec * 1000).toISOString().slice(0, 10);
  const endIso = new Date(endSec * 1000).toISOString().slice(0, 10);

  // SQL — single-line, safe (no user input interpolation, only numeric bounds).
  const sql =
    `SELECT ${COLUMNS.join(", ")} FROM admin_audit_log ` +
    `WHERE created_at >= ${startSec} AND created_at < ${endSec} ORDER BY id ASC`;

  const flag = remote ? "--remote" : "--local";
  console.log(`Exporting ${month} (${startIso} → ${endIso}) from ${dbName} ${flag}…`);

  const portalApiDir = path.resolve(__dirname, "..", "..", "portal-api");
  const cmd = `npx wrangler d1 execute ${dbName} ${flag} --json --command=${JSON.stringify(sql)}`;
  let stdout: string;
  try {
    stdout = execSync(cmd, { cwd: portalApiDir, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  } catch (e) {
    const err = e as { stderr?: Buffer | string; message?: string };
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    throw new Error(`wrangler d1 execute failed:\n${stderr}`);
  }

  // wrangler --json wraps in [{ results, success, meta }, …]. Stdout may
  // include a non-JSON banner; isolate the JSON payload by finding the
  // first '[' or '{' from EOF backwards.
  const jsonStart = stdout.search(/[\[{]/);
  if (jsonStart < 0) throw new Error(`unexpected wrangler output: ${stdout.slice(0, 200)}`);
  const parsed = JSON.parse(stdout.slice(jsonStart));
  const results: Row[] = Array.isArray(parsed) ? parsed[0]?.results ?? [] : parsed.results ?? [];

  const headerLine = COLUMNS.join(",");
  const dataLines = results.map((row) => COLUMNS.map((c) => escapeCsv(row[c])).join(","));
  const csv = [headerLine, ...dataLines].join("\n") + "\n";

  const outDir = path.resolve(__dirname, "..", "..", "audit-log");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${month}.csv`);
  fs.writeFileSync(outPath, csv, "utf8");

  console.log(`Wrote ${outPath} — ${results.length} row${results.length === 1 ? "" : "s"}`);
}

main();
