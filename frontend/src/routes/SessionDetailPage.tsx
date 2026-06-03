import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, AudioLines, Braces, Clock, MessageSquare, Radio, Zap } from "lucide-react";
import { useParams } from "react-router-dom";

import { EmptyState } from "../components/common/EmptyState";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MetricCard } from "../components/common/MetricCard";
import { StatusBadge, toneForStatus } from "../components/common/StatusBadge";
import { SessionDetailHeader } from "../components/sessions/SessionDetailHeader";
import { SessionStateTimeline } from "../components/sessions/SessionStateTimeline";
import { AudioPipeline } from "../components/sessions/AudioPipeline";
import { LatencyChart } from "../components/metrics/LatencyChart";
import { getSession, getSessionEvents, getSessionMetrics } from "../lib/api";
import { durationSeconds } from "../lib/time";
import type { LatencyMetric, SessionEvent, VoiceSession } from "../lib/types";

type EventGroupKind = "transcript" | "assistant" | "audio" | "latency" | "provider" | "error" | "barge" | "raw";

function textValue(value: unknown, fallback = "Recorded event") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatPayloadSummary(event: SessionEvent, kind: EventGroupKind) {
  const payload = event.payload;
  if (kind === "transcript") {
    return {
      primary: textValue(payload.text, event.event_type.includes("delta") ? "Transcript delta" : "Transcript final"),
      secondary: `${textValue(payload.speaker, "user")} transcript / ${textValue(payload.provider, "gateway")}`
    };
  }
  if (kind === "assistant") {
    const text = textValue(payload.text ?? payload.content, event.event_type.includes("audio") ? "Assistant audio activity" : "Assistant response activity");
    return {
      primary: text,
      secondary: `${textValue(payload.provider, "gateway")} / ${textValue(payload.response_id, "response pending")}`
    };
  }
  if (kind === "audio") {
    const bytes = numberValue(payload.frame_size_bytes);
    const sampleRate = numberValue(payload.sample_rate);
    const sequence = numberValue(event.sequence_number);
    return {
      primary: bytes ? `${bytes.toLocaleString()} byte audio frame received` : "Audio transport event",
      secondary: [
        sequence ? `seq ${sequence}` : null,
        sampleRate ? `${sampleRate.toLocaleString()} Hz` : null,
        textValue(payload.encoding, "")
      ].filter(Boolean).join(" / ") || "gateway audio pipeline"
    };
  }
  if (kind === "latency") {
    const value = numberValue(payload.value_ms);
    return {
      primary: value === null ? "Latency sample recorded" : `${value}ms`,
      secondary: event.event_type.replace(/_/g, " ")
    };
  }
  if (kind === "provider") {
    return {
      primary: textValue(payload.raw_provider_event_type ?? payload.provider_event_type, event.event_type),
      secondary: `${textValue(payload.provider, "provider")} / normalized as ${event.event_type}`
    };
  }
  if (kind === "error") {
    return {
      primary: textValue(payload.message ?? payload.error, "Session error recorded"),
      secondary: `${textValue(payload.provider, "gateway")} / ${textValue(payload.error_code, event.event_type)}`
    };
  }
  if (kind === "barge") {
    const recoveryMs = numberValue(payload.recovery_ms);
    return {
      primary: "Assistant response interrupted",
      secondary: recoveryMs === null ? "local playback stopped and provider interrupt sent" : `recovered in ${recoveryMs}ms`
    };
  }
  return {
    primary: event.event_type,
    secondary: `${event.direction} / ${new Date(event.created_at).toLocaleTimeString()}`
  };
}

function iconForKind(kind: EventGroupKind) {
  if (kind === "transcript") return MessageSquare;
  if (kind === "assistant") return Radio;
  if (kind === "audio") return AudioLines;
  if (kind === "latency") return Clock;
  if (kind === "provider") return Activity;
  if (kind === "error") return AlertTriangle;
  if (kind === "barge") return Zap;
  return Braces;
}

function EventGroup({ title, events, kind }: { title: string; events: SessionEvent[]; kind: EventGroupKind }) {
  const Icon = iconForKind(kind);
  return (
    <section className="ops-card rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title">{title}</h2>
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-panel px-2 py-1 text-xs text-steel">
          <Icon size={13} />
          {events.length}
        </span>
      </div>
      {events.length ? (
        <div className="scroll-dark max-h-[440px] space-y-2 overflow-auto pr-1">
          {events.map((event) => {
            const summary = formatPayloadSummary(event, kind);
            return (
              <div key={event.id} className="rounded-lg border border-line bg-panel/80 p-3 text-xs transition hover:border-cyan/30 hover:bg-cyan/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="line-clamp-3 font-semibold leading-5 text-ink">{summary.primary}</div>
                    <div className="mt-1 text-steel">{summary.secondary}</div>
                  </div>
                  <div className="shrink-0 rounded-full border border-line bg-card px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-steel">
                    {event.event_type.replace("server.", "")}
                  </div>
                </div>
                <div className="mt-2 text-[11px] text-steel">{new Date(event.created_at).toLocaleTimeString()}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No events recorded." />
      )}
    </section>
  );
}

function RawEventInspector({ events }: { events: SessionEvent[] }) {
  const latest = events.slice(-12).reverse();
  if (!latest.length) return null;
  return (
    <section className="ops-card rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title">Raw event viewer</h2>
        <span className="rounded-full border border-line bg-panel px-2 py-1 text-xs text-steel">{latest.length} latest</span>
      </div>
      <details className="rounded-lg border border-line bg-panel/90 p-3 text-xs text-cyan">
        <summary className="cursor-pointer font-semibold text-ink">Open collapsible JSON payloads</summary>
        <pre className="scroll-dark mt-3 max-h-96 overflow-auto whitespace-pre-wrap text-steel">{JSON.stringify(latest, null, 2)}</pre>
      </details>
    </section>
  );
}

export function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [metrics, setMetrics] = useState<LatencyMetric[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getSession(id), getSessionEvents(id), getSessionMetrics(id)])
      .then(([sessionData, eventsData, metricsData]) => {
        setSession(sessionData);
        setEvents(eventsData.events);
        setMetrics(metricsData.metrics);
      })
      .catch((exc) => setError(exc instanceof Error ? exc.message : String(exc)));
  }, [id]);

  const groups = useMemo(() => ({
    transcripts: events.filter((event) => event.event_type.includes("transcript")),
    assistant: events.filter((event) => event.event_type.includes("assistant")),
    audio: events.filter((event) => event.event_type.includes("audio")),
    provider: events.filter((event) => event.direction === "provider" || event.event_type.includes("provider")),
    errors: events.filter((event) => event.event_type.includes("error")),
    barge: events.filter((event) => event.event_type.includes("interrupted"))
  }), [events]);

  const latencyEvents: SessionEvent[] = metrics.map((metric) => ({
    id: metric.id,
    event_type: metric.metric_name,
    direction: "metric",
    payload: { value_ms: metric.value_ms, provider: metric.provider },
    sequence_number: null,
    created_at: metric.created_at
  }));
  const averageLatency = metrics.length ? Math.round(metrics.reduce((sum, metric) => sum + metric.value_ms, 0) / metrics.length) : 0;
  const providerLatency = metrics.find((metric) => !metric.metric_name.includes("audio_frame_ingest"))?.value_ms ?? averageLatency;
  const duration = session ? durationSeconds(session.started_at, session.ended_at) : "0s";

  return (
    <div className="space-y-5">
      <ErrorBanner message={error} />
      {session ? <SessionDetailHeader session={session} /> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Status" value={session?.status ?? "loading"} sub="session lifecycle" icon={<Activity size={18} />} tone={session?.status === "failed" ? "red" : "emerald"} />
        <MetricCard label="Provider" value={session?.provider ?? "unknown"} sub={session?.model ?? "model pending"} icon={<Radio size={18} />} tone="cyan" />
        <MetricCard label="Duration" value={duration} sub="trace runtime" icon={<Clock size={18} />} tone="blue" />
        <MetricCard label="Average latency" value={`${averageLatency}ms`} sub={`${metrics.length} samples`} icon={<Activity size={18} />} tone={averageLatency > 500 ? "amber" : "emerald"} />
        <MetricCard label="Errors" value={groups.errors.length} sub="provider/session" icon={<AlertTriangle size={18} />} tone={groups.errors.length ? "red" : "slate"} />
      </section>
      {session ? (
        <section className="ops-card rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title">Investigation posture</h2>
              <p className="mt-2 text-sm text-steel">Follow the voice trace from browser capture through gateway relay, provider events, transcript progression, and playback.</p>
            </div>
            <StatusBadge label={session.status} tone={toneForStatus(session.status)} pulse={!["ended", "failed"].includes(session.status)} />
          </div>
        </section>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <SessionStateTimeline events={events} />
        <AudioPipeline latencyMs={providerLatency} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <EventGroup title="Transcript progression" events={groups.transcripts} kind="transcript" />
        <LatencyChart title="Latency breakdown" values={metrics.map((metric) => metric.value_ms)} color="#22D3EE" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <EventGroup title="Assistant response timeline" events={groups.assistant} kind="assistant" />
        <EventGroup title="Provider interactions" events={groups.provider} kind="provider" />
        <EventGroup title="Audio events" events={groups.audio} kind="audio" />
        <EventGroup title="Latency samples" events={latencyEvents} kind="latency" />
        <EventGroup title="Interruptions" events={groups.barge} kind="barge" />
        <EventGroup title="Error events" events={groups.errors} kind="error" />
      </div>
      <RawEventInspector events={events} />
    </div>
  );
}
