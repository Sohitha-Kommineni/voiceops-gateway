import { describe, expect, it } from "vitest";

import { encodeClientMessage, parseServerMessage } from "./ws";

describe("ws protocol", () => {
  it("parses server messages", () => {
    const message = parseServerMessage('{"type":"server.heartbeat_ack","session_id":"s1","timestamp":1,"payload":{"ok":true}}');
    expect(message.type).toBe("server.heartbeat_ack");
    expect(message.payload.ok).toBe(true);
  });

  it("encodes client messages with payload", () => {
    expect(encodeClientMessage({ type: "client.heartbeat", session_id: "s1" })).toContain('"payload"');
  });
});
