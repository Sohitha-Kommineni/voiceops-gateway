from typing import Any, Literal

from pydantic import BaseModel, Field


ClientMessageType = Literal[
    "client.session.start",
    "client.audio.chunk",
    "client.audio.stop",
    "client.audio.mute",
    "client.audio.unmute",
    "client.response.interrupt",
    "client.heartbeat",
    "client.session.close",
]

ServerMessageType = Literal[
    "server.session.started",
    "server.session.state_changed",
    "server.audio.received",
    "server.audio.buffer_committed",
    "server.transcript.delta",
    "server.transcript.final",
    "server.assistant.text_delta",
    "server.assistant.text_final",
    "server.assistant.audio_delta",
    "server.assistant.audio_started",
    "server.assistant.audio_completed",
    "server.response.interrupted",
    "server.latency.update",
    "server.provider.connected",
    "server.provider.disconnected",
    "server.provider.error",
    "server.session.error",
    "server.session.ended",
    "server.heartbeat_ack",
]


class AudioChunk(BaseModel):
    session_id: str
    sequence_number: int = Field(ge=0)
    timestamp: int
    sample_rate: int = Field(ge=8000, le=48000)
    encoding: Literal["pcm16", "mulaw"]
    payload: str


class ClientMessage(BaseModel):
    type: ClientMessageType
    session_id: str
    sequence_number: int | None = None
    timestamp: int | None = None
    audio: AudioChunk | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class ServerMessage(BaseModel):
    type: ServerMessageType
    session_id: str
    timestamp: int
    sequence_number: int | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class RealtimeEvent(BaseModel):
    provider: str
    type: str
    payload: dict[str, Any] = Field(default_factory=dict)
    latency_ms: int | None = None
