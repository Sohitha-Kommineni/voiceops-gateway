import { useEffect, useState } from "react";
import { Activity, AlertTriangle, AudioLines, Database, Gauge, Radio, ShieldCheck, Zap } from "lucide-react";

import { EmptyState } from "../components/common/EmptyState";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MetricCard } from "../components/common/MetricCard";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { LatencyChart } from "../components/metrics/LatencyChart";
import { SessionHealthCard } from "../components/metrics/SessionHealthCard";
import { SessionTable } from "../components/sessions/SessionTable";
import { listSessions } from "../lib/api";
import type { VoiceSession } from "../lib/types";

export function SessionsPage() {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then((data) => {
        setSessions(data.sessions);
        setSummary(data.summary);
      })
      .catch((exc) => setError(exc instanceof Error ? exc.message : String(exc)));
  }, []);

  const averageLatency = Number(summary.average_assistant_response_latency ?? summary.average_first_transcript_latency ?? 0);
  const totalSessions = Number(summary.total_sessions ?? 0);
  const activeSessions = Number(summary.active_sessions ?? 0);
  const failedSessions = Number(summary.failed_sessions ?? 0);
  const bargeIns = sessions.reduce((sum, session) => sum + (typeof session.metadata?.barge_in_count === "number" ? session.metadata.barge_in_count : 0), 0);
  const latencyValues = sessions.map((session) => (typeof session.metadata?.average_latency_ms === "number" ? session.metadata.average_latency_ms : 0)).filter((value) => value > 0);

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />
      <PageHeader
        eyebrow="Operations overview"
        title="Realtime Voice Agent Infrastructure Monitoring"
        subtitle="Live system health, provider posture, stream throughput, latency, failures, and trace entry points for production voice agents."
        actions={
          <>
            <StatusBadge label={activeSessions ? "Live traffic" : "Idle"} tone={activeSessions ? "live" : "neutral"} pulse={activeSessions > 0} />
            <StatusBadge label={failedSessions ? "Failures detected" : "No active failures"} tone={failedSessions ? "failed" : "live"} />
          </>
        }
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Active sessions" value={activeSessions} sub="currently open" icon={<Radio size={18} />} tone="emerald" />
        <MetricCard label="Total sessions" value={totalSessions} sub="observed streams" icon={<AudioLines size={18} />} tone="cyan" />
        <MetricCard label="Average latency" value={`${averageLatency}ms`} sub="provider response posture" icon={<Gauge size={18} />} tone={averageLatency > 500 ? "amber" : "blue"} />
        <MetricCard label="Barge-ins" value={bargeIns} sub="interruptions" icon={<Zap size={18} />} tone="amber" />
        <MetricCard label="Errors" value={failedSessions} sub="terminal failures" icon={<AlertTriangle size={18} />} tone={failedSessions ? "red" : "emerald"} />
        <MetricCard label="Provider status" value="Mock" sub="OpenAI-ready gateway" icon={<ShieldCheck size={18} />} tone="emerald" />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <SessionHealthCard active={activeSessions} failed={failedSessions} latency={averageLatency} />
        <LatencyChart title="Realtime sessions" values={sessions.map((session) => (session.status === "ended" ? 1 : 2))} color="#34D399" />
        <LatencyChart title="Latency monitoring" values={latencyValues} color="#60A5FA" />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="ops-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Provider health</h2>
            <StatusBadge label="Connected path" tone="live" pulse={activeSessions > 0} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-line bg-panel/80 p-3"><Activity size={16} className="mb-2 text-ok" /><div className="font-semibold text-ink">Gateway online</div><div className="mt-1 text-xs text-steel">FastAPI websocket relay</div></div>
            <div className="rounded border border-line bg-panel/80 p-3"><Radio size={16} className="mb-2 text-cyan" /><div className="font-semibold text-ink">Mock realtime</div><div className="mt-1 text-xs text-steel">API-key safe mode</div></div>
            <div className="rounded border border-line bg-panel/80 p-3"><Database size={16} className="mb-2 text-blue" /><div className="font-semibold text-ink">Memory fallback</div><div className="mt-1 text-xs text-steel">local persistence</div></div>
          </div>
        </div>
        <div className="ops-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent operational activity</h2>
            <span className="text-xs text-steel">{sessions.length} traces</span>
          </div>
          <div className="mt-4 space-y-2">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded border border-line bg-panel/80 px-3 py-2 text-sm">
                <div>
                  <div className="font-mono text-xs text-ink">{session.id.slice(0, 8)}</div>
                  <div className="text-xs text-steel">{session.provider} / {session.status}</div>
                </div>
                <div className="text-right text-xs text-steel">
                  <div>{typeof session.metadata?.event_count === "number" ? session.metadata.event_count : 0} events</div>
                  <div>{typeof session.metadata?.average_latency_ms === "number" ? session.metadata.average_latency_ms : 0}ms avg</div>
                </div>
              </div>
            ))}
            {!sessions.length ? <EmptyState title="No operational traces yet." /> : null}
          </div>
        </div>
      </section>
      {sessions.length ? <SessionTable sessions={sessions} /> : <EmptyState title="No sessions have been created yet." />}
    </div>
  );
}
