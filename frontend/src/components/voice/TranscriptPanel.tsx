export function TranscriptPanel({ title, text }: { title: string; text: string }) {
  return (
    <section className="ops-card rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_18px_rgba(34,211,238,0.8)]" />
      </div>
      <pre className="min-h-36 whitespace-pre-wrap rounded border border-line bg-panel/80 p-3 font-mono text-sm leading-6 text-ink">{text || "Waiting for realtime transcript..."}</pre>
    </section>
  );
}
