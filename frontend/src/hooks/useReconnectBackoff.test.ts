import { describe, expect, it } from "vitest";

import { nextReconnectDelay } from "./useReconnectBackoff";

describe("reconnect backoff", () => {
  it("caps reconnect delay", () => {
    expect(nextReconnectDelay(0)).toBe(500);
    expect(nextReconnectDelay(20)).toBe(15000);
  });
});
