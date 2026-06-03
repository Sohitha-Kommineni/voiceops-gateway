import { Activity, AlertTriangle, CheckCircle2, Radio } from "lucide-react";

export function SessionHealthCard({
  active,
  failed,
  latency
}: {
  active: number;
  failed: number;
  latency: number;
}) {
  const degraded = failed > 0 || latency > 500;
  return (
    <section className="ops-card ops-gradient rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Session health</h2>
        <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${degraded ? "bg-warn/10 text-warn" : "bg-ok/10 text-ok"}`}>
          {degraded ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
          {degraded ? "Degraded" : "Healthy"}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded border border-line bg-panel/70 p-3">
          <Radio size={16} className="mb-2 text-ok" />
          <div className="text-2xl font-semibold tabular-nums text-ink">{active}</div>
          <div className="text-xs text-steel">live streams</div>
        </div>
        <div className="rounded border border-line bg-panel/70 p-3">
          <Activity size={16} className="mb-2 text-cyan" />
          <div className="text-2xl font-semibold tabular-nums text-ink">{latency}ms</div>
          <div className="text-xs text-steel">avg latency</div>
        </div>
        <div className="rounded border border-line bg-panel/70 p-3">
          <AlertTriangle size={16} className="mb-2 text-bad" />
          <div className="text-2xl font-semibold tabular-nums text-ink">{failed}</div>
          <div className="text-xs text-steel">failures</div>
        </div>
      </div>
    </section>
  );
}
