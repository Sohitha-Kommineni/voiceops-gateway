import type { ServerMessage } from "../../lib/types";
import { useLatencyMetrics } from "../../hooks/useLatencyMetrics";
import { MetricCard } from "../common/MetricCard";
import { Activity, Gauge, Radio } from "lucide-react";

export function LatencyPanel({ events }: { events: ServerMessage[] }) {
  const latency = useLatencyMetrics(events);
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <MetricCard label="Latest ingest" value={`${latency.latestIngest}ms`} sub="backend audio frame" icon={<Activity size={18} />} tone="cyan" />
      <MetricCard
        label="Provider latency"
        value={latency.providerSampleCount ? `${latency.providerAverage}ms` : "Pending"}
        sub={latency.providerSampleCount ? "transcript/assistant" : "awaiting transcript or response commit"}
        icon={<Radio size={18} />}
        tone={latency.providerSampleCount ? "emerald" : "amber"}
      />
      <MetricCard label="Latency samples" value={latency.count} sub="ingest + provider" icon={<Gauge size={18} />} tone="blue" />
    </section>
  );
}
