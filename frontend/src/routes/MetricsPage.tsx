import { useEffect, useMemo, useState } from "react";
import { Activity, Gauge, Radio, Timer } from "lucide-react";

import { EmptyState } from "../components/common/EmptyState";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MetricCard } from "../components/common/MetricCard";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { LatencyChart } from "../components/metrics/LatencyChart";
import { getSessionMetrics, listSessions } from "../lib/api";
import { formatTime } from "../lib/time";
import type { LatencyMetric } from "../lib/types";

export function MetricsPage() {
  const [metrics, setMetrics] = useState<LatencyMetric[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then(async (data) => {
        setSummary(data.summary);
        const recent = data.sessions.slice(0, 12);
        const metricResponses = await Promise.all(recent.map((session) => getSessionMetrics(session.id)));
        setMetrics(metricResponses.flatMap((response) => response.metrics));
      })
      .catch((exc) => setError(exc instanceof Error ? exc.message : String(exc)));
  }, []);

  const metricGroups = useMemo(() => {
    const provider = metrics.filter((metric) => !metric.metric_name.includes("audio_frame_ingest"));
    const ingest = metrics.filter((metric) => metric.metric_name.includes("audio_frame_ingest"));
    const average = metrics.length ? Math.round(metrics.reduce((sum, metric) => sum + metric.value_ms, 0) / metrics.length) : 0;
    const providerAverage = provider.length ? Math.round(provider.reduce((sum, metric) => sum + metric.value_ms, 0) / provider.length) : 0;
    const ingestAverage = ingest.length ? Math.round(ingest.reduce((sum, metric) => sum + metric.value_ms, 0) / ingest.length) : 0;
    return { provider, ingest, average, providerAverage, ingestAverage };
  }, [metrics]);

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />
      <PageHeader
        eyebrow="Metrics monitor"
        title="Voice Gateway Latency and Throughput"
        subtitle="Operational latency posture across audio ingest, transcript generation, assistant response, and playback events."
        actions={<StatusBadge label={`${metrics.length} samples`} tone={metrics.length ? "live" : "neutral"} />}
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Average latency" value={`${metricGroups.average}ms`} sub="all samples" icon={<Gauge size={18} />} tone="cyan" />
        <MetricCard label="Provider latency" value={`${metricGroups.providerAverage}ms`} sub="transcript / assistant" icon={<Radio size={18} />} tone="blue" />
        <MetricCard label="Ingest latency" value={`${metricGroups.ingestAverage}ms`} sub="backend audio frames" icon={<Activity size={18} />} tone="emerald" />
        <MetricCard label="Samples" value={metrics.length} sub="recent sessions" icon={<Timer size={18} />} tone="slate" />
        <MetricCard label="Active sessions" value={summary.active_sessions ?? 0} sub="current load" icon={<Radio size={18} />} tone="emerald" />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <LatencyChart title="Provider latency" values={metricGroups.provider.map((metric) => metric.value_ms)} color="#60A5FA" />
        <LatencyChart title="Audio ingest latency" values={metricGroups.ingest.map((metric) => metric.value_ms)} color="#34D399" />
      </section>
      <section className="ops-card rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Recent metric samples</h2>
          <span className="text-xs text-steel">latest operational measurements</span>
        </div>
        {metrics.length ? (
          <div className="scroll-dark max-h-[460px] space-y-2 overflow-auto pr-1">
            {metrics.slice(-80).reverse().map((metric) => (
              <div key={metric.id} className="grid gap-2 rounded-lg border border-line bg-panel/75 px-3 py-2 text-sm md:grid-cols-[1fr_120px_120px]">
                <div className="font-mono text-xs text-ink">{metric.metric_name}</div>
                <div className="tabular-nums text-cyan">{metric.value_ms}ms</div>
                <div className="text-xs text-steel">{formatTime(metric.created_at)}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No latency samples yet. Start a session and stop capture to commit mock provider events." />
        )}
      </section>
    </div>
  );
}
