import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Clock, GitBranch, MessageSquare, Radio } from "lucide-react";

import { EmptyState } from "../components/common/EmptyState";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MetricCard } from "../components/common/MetricCard";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge, toneForStatus } from "../components/common/StatusBadge";
import { getSessionEvents, listSessions } from "../lib/api";
import { durationSeconds, formatTime } from "../lib/time";
import type { SessionEvent, VoiceSession } from "../lib/types";

interface TraceRow {
  session: VoiceSession;
  events: SessionEvent[];
}

function metaNumber(session: VoiceSession, key: string): number {
  const value = session.metadata?.[key];
  return typeof value === "number" ? value : 0;
}

export function TracesPage() {
  const [rows, setRows] = useState<TraceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then(async (data) => {
        const recent = data.sessions.slice(0, 12);
        const hydrated = await Promise.all(
          recent.map(async (session) => ({
            session,
            events: (await getSessionEvents(session.id)).events
          }))
        );
        setRows(hydrated);
      })
      .catch((exc) => setError(exc instanceof Error ? exc.message : String(exc)));
  }, []);

  const totals = useMemo(() => {
    const eventCount = rows.reduce((sum, row) => sum + row.events.length, 0);
    const providerEvents = rows.reduce((sum, row) => sum + row.events.filter((event) => event.event_type.includes("provider")).length, 0);
    const transcriptEvents = rows.reduce((sum, row) => sum + row.events.filter((event) => event.event_type.includes("transcript")).length, 0);
    const audioEvents = rows.reduce((sum, row) => sum + row.events.filter((event) => event.event_type.includes("audio")).length, 0);
    return { eventCount, providerEvents, transcriptEvents, audioEvents };
  }, [rows]);

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />
      <PageHeader
        eyebrow="Trace explorer"
        title="Realtime Voice Session Traces"
        subtitle="Investigate session lifecycles, event density, provider interactions, transcript progression, and audio pipeline activity."
        actions={<StatusBadge label={`${rows.length} traces loaded`} tone={rows.length ? "live" : "neutral"} />}
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Trace events" value={totals.eventCount} sub="captured timeline entries" icon={<GitBranch size={18} />} tone="cyan" />
        <MetricCard label="Provider events" value={totals.providerEvents} sub="realtime provider activity" icon={<Radio size={18} />} tone="blue" />
        <MetricCard label="Transcript events" value={totals.transcriptEvents} sub="user and assistant text" icon={<MessageSquare size={18} />} tone="emerald" />
        <MetricCard label="Audio events" value={totals.audioEvents} sub="ingress and playback" icon={<Activity size={18} />} tone="amber" />
      </section>
      <section className="ops-card rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Recent traces</h2>
          <span className="text-xs text-steel">Click a trace to investigate</span>
        </div>
        {rows.length ? (
          <div className="space-y-3">
            {rows.map(({ session, events }) => {
              const lastEvent = events[events.length - 1];
              return (
                <Link key={session.id} to={`/sessions/${session.id}`} className="block rounded-lg border border-line bg-panel/75 p-4 transition hover:border-cyan/30 hover:bg-cyan/5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm text-ink">{session.id}</div>
                      <div className="mt-1 text-xs text-steel">{session.provider} / {session.transport} / {durationSeconds(session.started_at, session.ended_at)}</div>
                    </div>
                    <StatusBadge label={session.status} tone={toneForStatus(session.status)} pulse={!["ended", "failed", "created"].includes(session.status)} />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-steel md:grid-cols-4">
                    <div><span className="text-ink">{events.length}</span> events</div>
                    <div><span className="text-ink">{metaNumber(session, "average_latency_ms")}ms</span> avg latency</div>
                    <div><span className="text-ink">{metaNumber(session, "error_count")}</span> errors</div>
                    <div className="flex items-center gap-1"><Clock size={13} /> {lastEvent ? formatTime(lastEvent.created_at) : "no events"}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No traces available yet. Start a voice session to generate trace data." />
        )}
      </section>
    </div>
  );
}
