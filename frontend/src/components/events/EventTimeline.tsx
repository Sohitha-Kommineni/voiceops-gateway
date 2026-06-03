import type { ServerMessage } from "../../lib/types";

export function EventTimeline({ events }: { events: ServerMessage[] }) {
  return (
    <section className="ops-card rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">Realtime event stream</h2>
        <span className="rounded-full border border-line bg-panel px-2 py-1 text-xs text-steel">{events.length} events</span>
      </div>
      <div className="scroll-dark max-h-96 space-y-2 overflow-auto pr-1">
        {events.map((event, index) => (
          <div key={`${event.timestamp}-${index}`} className="rounded-lg border border-line bg-panel/80 px-3 py-2 text-xs transition hover:border-cyan/30 hover:bg-cyan/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${event.type.includes("error") ? "bg-bad" : event.type.includes("provider") ? "bg-blue" : event.type.includes("audio") ? "bg-cyan" : "bg-ok"}`} />
                <span className="truncate font-semibold text-ink">{event.type}</span>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-steel">{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
            {event.payload.metric_name ? <div className="mt-1 pl-4 text-steel">{String(event.payload.metric_name)} {event.payload.value_ms ? `${event.payload.value_ms}ms` : ""}</div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
