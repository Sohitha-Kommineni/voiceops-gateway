import { describe, expect, it } from "vitest";

import { consoleReducer, initialConsoleState } from "./sessionReducer";

describe("console reducer", () => {
  it("tracks provider and assistant state", () => {
    const connected = consoleReducer(initialConsoleState, {
      type: "server.provider.connected",
      session_id: "s1",
      timestamp: 1,
      payload: {}
    });
    expect(connected.providerConnected).toBe(true);
    const speaking = consoleReducer(connected, {
      type: "server.assistant.audio_started",
      session_id: "s1",
      timestamp: 2,
      payload: {}
    });
    expect(speaking.assistantSpeaking).toBe(true);
  });
});
