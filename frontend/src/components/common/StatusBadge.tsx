import { Circle, Radio } from "lucide-react";

export type StatusTone = "live" | "degraded" | "failed" | "ended" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  live: "border-ok/30 bg-ok/10 text-ok shadow-[0_0_24px_rgba(52,211,153,0.08)]",
  degraded: "border-warn/30 bg-warn/10 text-warn",
  failed: "border-bad/30 bg-bad/10 text-bad",
  ended: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  neutral: "border-line bg-panel text-steel"
};

export function toneForStatus(status?: string | null): StatusTone {
  if (!status) return "neutral";
  if (status === "failed" || status.includes("error")) return "failed";
  if (status === "ended" || status === "ending") return "ended";
  if (status === "created" || status === "connecting" || status === "provider_connecting" || status === "reconnecting") return "degraded";
  return "live";
}

export function StatusBadge({
  label,
  tone = "neutral",
  pulse = false
}: {
  label: string;
  tone?: StatusTone;
  pulse?: boolean;
}) {
  const Icon = pulse ? Radio : Circle;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
      <Icon size={pulse ? 13 : 8} className={pulse ? "animate-pulse" : "fill-current"} />
      {label}
    </span>
  );
}
