import type { ServerMessage, SessionState } from "./types";

export interface ConsoleState {
  sessionState: SessionState;
  providerConnected: boolean;
  assistantSpeaking: boolean;
  errors: string[];
}

export const initialConsoleState: ConsoleState = {
  sessionState: "created",
  providerConnected: false,
  assistantSpeaking: false,
  errors: []
};

export function consoleReducer(state: ConsoleState, event: ServerMessage): ConsoleState {
  if (event.type === "server.session.state_changed") {
    return { ...state, sessionState: String(event.payload.state) as SessionState };
  }
  if (event.type === "server.provider.connected") return { ...state, providerConnected: true };
  if (event.type === "server.provider.disconnected") return { ...state, providerConnected: false };
  if (event.type === "server.assistant.audio_started") return { ...state, assistantSpeaking: true };
  if (event.type === "server.assistant.audio_completed" || event.type === "server.response.interrupted") {
    return { ...state, assistantSpeaking: false };
  }
  if (event.type.includes("error")) {
    return { ...state, errors: [String(event.payload.message ?? event.type), ...state.errors] };
  }
  return state;
}
