interface Props {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "bad" | "neutral";
}

export function ConnectionBadge({ label, value, tone = "neutral" }: Props) {
  const color = {
    ok: "border-ok/30 bg-ok/10 text-ok",
    warn: "border-warn/30 bg-warn/10 text-warn",
    bad: "border-bad/30 bg-bad/10 text-bad",
    neutral: "border-line bg-panel text-steel"
  }[tone];
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${color}`}>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      <span>{value}</span>
    </div>
  );
}
