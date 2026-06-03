import type { SessionEvent } from "../../lib/types";

export function SessionStateTimeline({ events }: { events: SessionEvent[] }) {
  const stateEvents = events.filter((event) => event.event_type.includes("state") || event.payload.state);
  return (
    <section className="ops-card rounded-lg p-4">
      <h2 className="section-title mb-4">Session lifecycle</h2>
      <div className="relative space-y-3 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-line">
        {stateEvents.map((event) => (
          <div key={event.id} className="relative pl-7">
            <span className="absolute left-0 top-2 h-3.5 w-3.5 rounded-full border border-cyan/30 bg-cyan shadow-[0_0_18px_rgba(34,211,238,0.45)]" />
            <div className="rounded-lg border border-line bg-panel/80 px-3 py-2 text-sm">
              <span className="font-semibold text-ink">{String(event.payload.state ?? event.event_type)}</span>
              <span className="ml-2 text-xs text-steel">{new Date(event.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
        {!stateEvents.length ? <div className="pl-7"><span className="text-sm text-steel">No state transitions recorded.</span></div> : null}
      </div>
    </section>
  );
}
