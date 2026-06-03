export function AudioPlaybackStatus({ speaking, queued }: { speaking: boolean; queued: number }) {
  return (
    <section className="ops-card rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Assistant playback</h2>
        <span className={`h-2.5 w-2.5 rounded-full ${speaking ? "animate-pulse bg-ok shadow-[0_0_18px_rgba(52,211,153,0.7)]" : "bg-slate-600"}`} />
      </div>
      <div className="mt-4 text-lg font-semibold text-ink">{speaking ? "Speaking" : "Idle"}</div>
      <div className="mt-1 text-sm text-steel">{queued} queued buffers</div>
    </section>
  );
}
