import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Radio, Siren } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "../components/common/EmptyState";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MetricCard } from "../components/common/MetricCard";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge, toneForStatus } from "../components/common/StatusBadge";
import { listSessions } from "../lib/api";
import { formatTime } from "../lib/time";
import type { VoiceSession } from "../lib/types";

function metaNumber(session: VoiceSession, key: string): number {
  const value = session.metadata?.[key];
  return typeof value === "number" ? value : 0;
}

export function AlertsPage() {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then((data) => setSessions(data.sessions))
      .catch((exc) => setError(exc instanceof Error ? exc.message : String(exc)));
  }, []);

  const alerts = useMemo(() => {
    const failed = sessions.filter((session) => session.status === "failed");
    const errored = sessions.filter((session) => metaNumber(session, "error_count") > 0);
    const slow = sessions.filter((session) => metaNumber(session, "average_latency_ms") > 800);
    const stale = sessions.filter((session) => ["connecting", "provider_connecting", "reconnecting"].includes(session.status));
    return { failed, errored, slow, stale, all: [...failed, ...errored, ...slow, ...stale] };
  }, [sessions]);

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />
      <PageHeader
        eyebrow="Alert center"
        title="Realtime Voice Infrastructure Alerts"
        subtitle="Operational exceptions derived from session state, provider failures, latency posture, and gateway error counts."
        actions={<StatusBadge label={alerts.all.length ? "Attention required" : "No active alerts"} tone={alerts.all.length ? "degraded" : "live"} pulse={alerts.all.length > 0} />}
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Failed sessions" value={alerts.failed.length} sub="terminal state" icon={<Siren size={18} />} tone={alerts.failed.length ? "red" : "emerald"} />
        <MetricCard label="Error traces" value={alerts.errored.length} sub="error events present" icon={<AlertTriangle size={18} />} tone={alerts.errored.length ? "amber" : "emerald"} />
        <MetricCard label="Slow sessions" value={alerts.slow.length} sub="avg latency over 800ms" icon={<Radio size={18} />} tone={alerts.slow.length ? "amber" : "blue"} />
        <MetricCard label="Healthy baseline" value={Math.max(0, sessions.length - alerts.all.length)} sub="no derived alert" icon={<CheckCircle2 size={18} />} tone="emerald" />
      </section>
      <section className="ops-card rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Active alert feed</h2>
          <span className="text-xs text-steel">derived from existing session records</span>
        </div>
        {alerts.all.length ? (
          <div className="space-y-3">
            {alerts.all.map((session) => (
              <Link key={`${session.id}-${session.status}-${metaNumber(session, "average_latency_ms")}`} to={`/sessions/${session.id}`} className="block rounded-lg border border-warn/30 bg-warn/10 p-4 transition hover:bg-warn/15">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm text-ink">{session.id}</div>
                    <div className="mt-1 text-xs text-steel">{session.provider} / {formatTime(session.created_at)}</div>
                  </div>
                  <StatusBadge label={session.status} tone={toneForStatus(session.status)} />
                </div>
                <div className="mt-3 text-sm text-steel">
                  {session.status === "failed" ? "Session entered terminal failed state." : metaNumber(session, "average_latency_ms") > 800 ? "Average latency exceeded alert threshold." : "Error events were recorded for this trace."}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No active alerts. The current local gateway posture is nominal." />
        )}
      </section>
    </div>
  );
}
