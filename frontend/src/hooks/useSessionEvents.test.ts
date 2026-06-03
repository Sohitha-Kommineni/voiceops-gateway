import { describe, expect, it } from "vitest";

import { retainOperationalEvents } from "./useSessionEvents";
import type { ServerMessage } from "../lib/types";

function message(type: ServerMessage["type"], timestamp: number, payload: Record<string, unknown> = {}): ServerMessage {
  return {
    type,
    session_id: "session-1",
    timestamp,
    payload
  };
}

describe("retainOperationalEvents", () => {
  it("keeps provider latency events even when audio ingest events flood the timeline", () => {
    const provider = message("server.assistant.text_delta", 1, { latency_ms: 120, text: "hello" });
    const noisy = Array.from({ length: 500 }, (_, index) =>
      message("server.latency.update", index + 2, { metric_name: "audio_frame_ingest_ms", value_ms: 1 })
    );

    const retained = retainOperationalEvents([...noisy, provider]);

    expect(retained).toContain(provider);
    expect(retained.filter((event) => event.payload.metric_name === "audio_frame_ingest_ms").length).toBeLessThanOrEqual(260);
  });
});
