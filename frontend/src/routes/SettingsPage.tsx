import { Cpu, Database, Globe, Lock, Radio, Server } from "lucide-react";

import { MetricCard } from "../components/common/MetricCard";
import { PageHeader } from "../components/common/PageHeader";
import { StatusBadge } from "../components/common/StatusBadge";
import { API_BASE_URL } from "../lib/constants";

function ConfigRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel/75 px-4 py-3">
      <div>
        <div className="font-semibold text-ink">{label}</div>
        <div className="mt-1 text-xs text-steel">{detail}</div>
      </div>
      <code className="rounded border border-line bg-card px-2.5 py-1 text-xs text-cyan">{value}</code>
    </div>
  );
}

export function SettingsPage() {
  const env = import.meta.env.MODE === "production" ? "production" : "local";
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Gateway settings"
        title="Runtime Configuration and Production Guardrails"
        subtitle="Read-only operational configuration for the local VoiceOps Gateway frontend and realtime provider posture."
        actions={<StatusBadge label="Configuration loaded" tone="live" />}
      />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Environment" value={env} sub="frontend runtime" icon={<Globe size={18} />} tone="emerald" />
        <MetricCard label="Provider mode" value="Mock" sub="OpenAI key safe fallback" icon={<Radio size={18} />} tone="amber" />
        <MetricCard label="Transport" value="WebSocket" sub="browser to gateway" icon={<Server size={18} />} tone="cyan" />
        <MetricCard label="Secrets" value="Server-side" sub="API keys never exposed" icon={<Lock size={18} />} tone="blue" />
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="ops-card rounded-lg p-4">
          <h2 className="section-title mb-4">Frontend runtime</h2>
          <div className="space-y-3">
            <ConfigRow label="API base URL" value={API_BASE_URL} detail="REST API and session metadata endpoint target." />
            <ConfigRow label="WebSocket gateway" value="/ws/v1/sessions/:id/audio" detail="Realtime audio transport path resolved from the backend host." />
            <ConfigRow label="Audio capture" value="AudioWorklet + PCM16" detail="Browser microphone capture and non-blocking frame streaming." />
          </div>
        </div>
        <div className="ops-card rounded-lg p-4">
          <h2 className="section-title mb-4">Backend capabilities</h2>
          <div className="space-y-3">
            <ConfigRow label="Persistence" value="PostgreSQL / memory fallback" detail="Local fallback is active when database services are unavailable." />
            <ConfigRow label="Live state" value="Redis / memory fallback" detail="Session heartbeat and active state cache." />
            <ConfigRow label="Metrics" value="/metrics" detail="Prometheus-compatible metric endpoint." />
          </div>
        </div>
      </section>
      <section className="ops-card rounded-lg p-4">
        <h2 className="section-title mb-4">Production readiness posture</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded border border-line bg-panel/75 p-4"><Cpu size={18} className="mb-3 text-cyan" /><div className="font-semibold text-ink">Realtime gateway</div><p className="mt-1 text-sm text-steel">Server-side provider WebSocket keeps API keys out of the browser.</p></div>
          <div className="rounded border border-line bg-panel/75 p-4"><Database size={18} className="mb-3 text-blue" /><div className="font-semibold text-ink">Observable sessions</div><p className="mt-1 text-sm text-steel">Sessions, events, transcripts, audio events, errors, and latency metrics are modeled separately.</p></div>
          <div className="rounded border border-line bg-panel/75 p-4"><Lock size={18} className="mb-3 text-ok" /><div className="font-semibold text-ink">Operational safeguards</div><p className="mt-1 text-sm text-steel">Heartbeat, rate-limit structure, CORS settings, and metrics are available for production hardening.</p></div>
        </div>
      </section>
    </div>
  );
}
