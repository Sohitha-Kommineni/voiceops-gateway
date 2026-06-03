export type SessionState =
  | "created"
  | "connecting"
  | "provider_connecting"
  | "connected"
  | "listening"
  | "user_speaking"
  | "transcribing"
  | "assistant_thinking"
  | "assistant_speaking"
  | "interrupted"
  | "reconnecting"
  | "ending"
  | "ended"
  | "failed";

export type ClientMessageType =
  | "client.session.start"
  | "client.audio.chunk"
  | "client.audio.stop"
  | "client.audio.mute"
  | "client.audio.unmute"
  | "client.response.interrupt"
  | "client.heartbeat"
  | "client.session.close";

export type ServerMessageType =
  | "server.session.started"
  | "server.session.state_changed"
  | "server.audio.received"
  | "server.audio.buffer_committed"
  | "server.transcript.delta"
  | "server.transcript.final"
  | "server.assistant.text_delta"
  | "server.assistant.text_final"
  | "server.assistant.audio_delta"
  | "server.assistant.audio_started"
  | "server.assistant.audio_completed"
  | "server.response.interrupted"
  | "server.latency.update"
  | "server.provider.connected"
  | "server.provider.disconnected"
  | "server.provider.error"
  | "server.session.error"
  | "server.session.ended"
  | "server.heartbeat_ack";

export interface VoiceSession {
  id: string;
  status: SessionState;
  transport: string;
  provider: string;
  model: string | null;
  created_at: string;
  updated_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  last_heartbeat_at: string | null;
  metadata: Record<string, unknown>;
}

export interface AudioChunk {
  session_id: string;
  sequence_number: number;
  timestamp: number;
  sample_rate: number;
  encoding: "pcm16" | "mulaw";
  payload: string;
}

export interface ClientMessage {
  type: ClientMessageType;
  session_id: string;
  sequence_number?: number;
  timestamp?: number;
  audio?: AudioChunk;
  payload?: Record<string, unknown>;
}

export interface ServerMessage {
  type: ServerMessageType;
  session_id: string;
  timestamp: number;
  sequence_number?: number;
  payload: Record<string, unknown>;
}

export interface SessionEvent {
  id: string;
  event_type: string;
  direction: string;
  payload: Record<string, unknown>;
  sequence_number: number | null;
  created_at: string;
}

export interface LatencyMetric {
  id: string;
  metric_name: string;
  value_ms: number;
  provider: string | null;
  turn_index: number | null;
  created_at: string;
}
