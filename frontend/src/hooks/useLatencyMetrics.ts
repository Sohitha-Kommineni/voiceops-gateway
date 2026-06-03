import { useMemo } from "react";

import type { ServerMessage } from "../lib/types";

export function useLatencyMetrics(events: ServerMessage[]) {
  return useMemo(() => {
    const values = events
      .map((event) => Number(event.payload.latency_ms ?? event.payload.value_ms ?? 0))
      .filter((value) => value > 0);
    const ingestValues = events
      .filter((event) => event.type === "server.latency.update" && event.payload.metric_name === "audio_frame_ingest_ms")
      .map((event) => Number(event.payload.value_ms ?? 0))
      .filter((value) => value > 0);
    const providerValues = events
      .filter((event) => {
        if (event.type === "server.audio.received") return false;
        if (event.type === "server.latency.update") return event.payload.metric_name !== "audio_frame_ingest_ms";
        return event.type.includes("transcript") || event.type.includes("assistant") || event.type.includes("provider");
      })
      .map((event) => Number(event.payload.latency_ms ?? event.payload.value_ms ?? 0))
      .filter((value) => value > 0);
    const average = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
    const providerAverage = providerValues.length ? Math.round(providerValues.reduce((sum, value) => sum + value, 0) / providerValues.length) : 0;
    return {
      average,
      latest: values[0] ?? 0,
      latestIngest: ingestValues[0] ?? 0,
      providerAverage,
      providerSampleCount: providerValues.length,
      count: values.length
    };
  }, [events]);
}
