import type { ClientMessage, ServerMessage } from "./types";

export function parseServerMessage(raw: string): ServerMessage {
  const parsed = JSON.parse(raw) as ServerMessage;
  if (!parsed.type || !parsed.session_id || !parsed.payload) {
    throw new Error("invalid server message");
  }
  return parsed;
}

export function encodeClientMessage(message: ClientMessage): string {
  return JSON.stringify({ payload: {}, ...message });
}
