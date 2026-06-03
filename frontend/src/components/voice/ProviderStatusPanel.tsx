export function ProviderStatusPanel({ provider, connected }: { provider: string; connected: boolean }) {
  return (
    <section className="ops-card rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Provider health</h2>
        <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-ok shadow-[0_0_18px_rgba(52,211,153,0.7)]" : "bg-warn"}`} />
      </div>
      <div className="mt-4 text-lg font-semibold text-ink">{provider}</div>
      <div className={connected ? "mt-1 text-sm text-ok" : "mt-1 text-sm text-warn"}>
        {connected ? "Connected" : provider.includes("Mock") ? "Mock Realtime Active" : "Not connected"}
      </div>
    </section>
  );
}
