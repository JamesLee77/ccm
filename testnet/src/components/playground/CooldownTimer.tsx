import { useEffect, useState } from "react";

function fmt(secs: number): string {
  if (secs <= 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2,"0")}`;
}

export default function CooldownTimer({ untilTimestamp }: { untilTimestamp: bigint }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Number(untilTimestamp) - now);
  if (remaining <= 0) return null;
  return <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--ink-soft)" }}>{fmt(remaining)}</span>;
}
