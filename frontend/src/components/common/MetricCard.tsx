import type { ReactNode } from "react";

export function MetricCard({
  label,
  value,
  sub,
  icon,
  tone = "cyan"
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  tone?: "cyan" | "emerald" | "blue" | "amber" | "red" | "slate";
}) {
  const accent = {
    cyan: "from-cyan/20 text-cyan",
    emerald: "from-ok/20 text-ok",
    blue: "from-blue/20 text-blue",
    amber: "from-warn/20 text-warn",
    red: "from-bad/20 text-bad",
    slate: "from-slate-500/20 text-slate-300"
  }[tone];
  return (
    <div className={`ops-card ops-gradient rounded-lg bg-gradient-to-br ${accent} p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyan/30`}>
      <div className="flex items-center justify-between gap-3">
        <div className="section-title">{label}</div>
        {icon ? <div className="text-current opacity-90">{icon}</div> : null}
      </div>
      <div className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-ink">{value}</div>
      {sub ? <div className="mt-1 text-xs text-steel">{sub}</div> : null}
    </div>
  );
}
