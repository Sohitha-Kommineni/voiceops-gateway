import { Activity, Bug, Headphones, Mic2, Radio, Server, Zap } from "lucide-react";

import { ConnectionBadge } from "../components/common/ConnectionBadge";
import { ErrorBanner } from "../components/common/ErrorBanner";
import { MetricCard } from "../components/common/MetricCard";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge, toneForStatus } from "../components/common/StatusBadge";
import { AudioPlaybackStatus } from "../components/voice/AudioPlaybackStatus";
import { AudioLevelMeter } from "../components/voice/AudioLevelMeter";
import { AssistantPanel } from "../components/voice/AssistantPanel";
import { MicrophonePermissionCard } from "../components/voice/MicrophonePermissionCard";
import { ProviderStatusPanel } from "../components/voice/ProviderStatusPanel";
import { SessionControls } from "../components/voice/SessionControls";
import { TranscriptPanel } from "../components/voice/TranscriptPanel";
import { EventTimeline } from "../components/events/EventTimeline";
import { RawEventDrawer } from "../components/events/RawEventDrawer";
import { LatencyPanel } from "../components/metrics/LatencyPanel";
import { LatencyChart } from "../components/metrics/LatencyChart";
import { useLatencyMetrics } from "../hooks/useLatencyMetrics";
import { useVoiceSession } from "../hooks/useVoiceSession";

export function VoiceConsolePage() {
  const voice = useVoiceSession();
  const latency = useLatencyMetrics(voice.timeline.events);
  const transportTone = voice.ws.status === "open" ? "ok" : voice.ws.status === "error" ? "bad" : "warn";
  const providerTone = voice.providerConnected ? "ok" : voice.providerLabel.includes("Mock") ? "warn" : "neutral";
  const displayedUserTranscript = voice.localSpeechTranscript || voice.userTranscript;
  const userTranscriptTitle =
    voice.localSpeechSupported && voice.localSpeechTranscript
      ? "Live User Transcript Stream"
      : "Backend Mock Transcript Stream";

  return (
    <div className="space-y-5">
      <ErrorBanner message={voice.error} />
      <PageHeader
        eyebrow="Live operations"
        title="Realtime Voice Mission Control"
        subtitle="Observe microphone ingress, gateway transport, provider behavior, transcripts, and assistant playback for the active voice stream."
        actions={
          <>
            <ConnectionBadge label="provider" value={voice.providerLabel} tone={providerTone} />
            <ConnectionBadge label="ws" value={voice.ws.status} tone={transportTone} />
            <ConnectionBadge label="mic" value={voice.mic.status} tone={voice.mic.status === "granted" ? "ok" : "warn"} />
            <StatusBadge label={voice.sessionState} tone={toneForStatus(voice.sessionState)} pulse={voice.sessionState !== "ended" && voice.sessionState !== "created"} />
          </>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Stream state" value={voice.sessionState} sub={voice.session?.id ? voice.session.id.slice(0, 8) : "no active session"} icon={<Radio size={18} />} tone={voice.sessionState === "failed" ? "red" : "emerald"} />
        <MetricCard label="Mic signal" value={Math.round(voice.level * 1000)} sub={voice.level > 0.02 ? "user speaking" : "ambient / idle"} icon={<Mic2 size={18} />} tone="cyan" />
        <MetricCard label="Transport" value={voice.ws.status} sub="frontend websocket" icon={<Server size={18} />} tone={voice.ws.status === "open" ? "emerald" : "amber"} />
        <MetricCard label="Provider latency" value={latency.providerSampleCount ? `${latency.providerAverage}ms` : "Pending"} sub={latency.providerSampleCount ? "provider event observed" : "awaiting transcript/response"} icon={<Activity size={18} />} tone={latency.providerSampleCount ? "blue" : "amber"} />
        <MetricCard label="Interruptions" value={voice.timeline.events.filter((event) => event.type.includes("interrupted")).length} sub="barge-in events" icon={<Zap size={18} />} tone="amber" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <MicrophonePermissionCard status={voice.mic.status} onRequest={voice.mic.request} />
          <section className="ops-card rounded-lg p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="section-title">Stream controls</h2>
              <StatusBadge label={voice.capture.capturing ? "capturing" : "idle"} tone={voice.capture.capturing ? "live" : "neutral"} pulse={voice.capture.capturing} />
            </div>
            <SessionControls
              canCapture={Boolean(voice.session)}
              capturing={voice.capture.capturing}
              muted={voice.capture.muted}
              onStartSession={voice.startSession}
              onStartCapture={voice.startCapture}
              onStop={voice.stopSession}
              onMute={voice.capture.setMute}
              onInterrupt={voice.interrupt}
            />
            <div className="mt-4">
              <AudioLevelMeter level={voice.level} />
            </div>
          </section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <ProviderStatusPanel provider={voice.providerLabel} connected={voice.providerConnected} />
            <AudioPlaybackStatus speaking={voice.playback.speaking} queued={voice.playback.queued} />
          </div>
          <section className="ops-card rounded-lg p-4 text-sm text-steel">
            <div className="flex items-center gap-2 font-semibold text-ink"><Activity size={16} className="text-cyan" />Runtime state vector</div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              <span>Browser mic</span><span className="text-ink">{voice.mic.status}</span>
              <span>Frontend WS</span><span className="text-ink">{voice.ws.status}</span>
              <span>Backend session</span><span className="text-ink">{voice.sessionState}</span>
              <span>Provider</span><span className="text-ink">{voice.providerConnected ? "connected" : "waiting"}</span>
              <span>User speaking</span><span className="text-ink">{voice.level > 0.02 ? "yes" : "no"}</span>
              <span>Assistant speaking</span><span className="text-ink">{voice.playback.speaking ? "yes" : "no"}</span>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 2xl:grid-cols-2">
            <TranscriptPanel title={userTranscriptTitle} text={displayedUserTranscript} />
            <AssistantPanel text={voice.assistantTranscript} />
          </div>
          {voice.providerLabel.includes("Mock") ? (
            <div className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
              Mock Realtime confirms audio transport. Exact spoken-word transcription uses browser speech recognition when available, or OpenAI Realtime in real mode.
              {voice.localSpeechSupported ? ` Browser speech recognition is ${voice.localSpeechListening ? "listening" : "available"}.` : " Browser speech recognition is not available in this browser."}
              {voice.localSpeechError ? ` Speech recognition status: ${voice.localSpeechError}.` : ""}
            </div>
          ) : null}
          <LatencyPanel events={voice.timeline.events} />
          <div className="grid gap-4 2xl:grid-cols-[0.8fr_1.2fr]">
            <LatencyChart title="Latency monitoring" values={voice.timeline.events.map((event) => Number(event.payload.latency_ms ?? event.payload.value_ms ?? 0)).filter((value) => value > 0)} />
            <EventTimeline events={voice.timeline.events} />
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink hover:border-cyan/30 hover:bg-cyan/10" onClick={() => voice.timeline.setRawOpen(true)}>
            <Bug size={16} className="text-cyan" />
            Debug raw events
          </button>
        </div>
      </div>
      <RawEventDrawer open={voice.timeline.rawOpen} events={voice.timeline.events} onClose={() => voice.timeline.setRawOpen(false)} />
    </div>
  );
}
