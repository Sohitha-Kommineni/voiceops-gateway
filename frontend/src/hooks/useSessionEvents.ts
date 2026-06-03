import { useMemo, useState } from "react";

import type { ServerMessage } from "../lib/types";

const MAX_EVENTS = 600;
const MAX_NOISY_EVENTS = 260;
const MAX_HIGH_SIGNAL_EVENTS = 340;

function isNoisyTransportEvent(event: ServerMessage): boolean {
  return (
    event.type === "server.audio.received" ||
    (event.type === "server.latency.update" && event.payload.metric_name === "audio_frame_ingest_ms")
  );
}

export function retainOperationalEvents(events: ServerMessage[]): ServerMessage[] {
  const highSignal = events.filter((event) => !isNoisyTransportEvent(event)).slice(0, MAX_HIGH_SIGNAL_EVENTS);
  const noisy = events.filter(isNoisyTransportEvent).slice(0, MAX_NOISY_EVENTS);
  return [...highSignal, ...noisy]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_EVENTS);
}

export function useSessionEvents() {
  const [events, setEvents] = useState<ServerMessage[]>([]);
  const [rawOpen, setRawOpen] = useState(false);
  const push = (event: ServerMessage) => setEvents((current) => retainOperationalEvents([event, ...current]));
  const errors = useMemo(() => events.filter((event) => event.type.includes("error")), [events]);
  return { events, errors, rawOpen, setRawOpen, push };
}
