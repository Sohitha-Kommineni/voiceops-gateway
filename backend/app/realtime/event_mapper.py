from app.ws.protocol import server_event
from app.ws.schemas import RealtimeEvent, ServerMessage

OPENAI_TYPE_MAP = {
    "conversation.item.input_audio_transcription.delta": "server.transcript.delta",
    "conversation.item.input_audio_transcription.completed": "server.transcript.final",
    "response.text.delta": "server.assistant.text_delta",
    "response.text.done": "server.assistant.text_final",
    "response.audio.delta": "server.assistant.audio_delta",
    "response.audio.done": "server.assistant.audio_completed",
    "response.created": "server.assistant.audio_started",
    "error": "server.provider.error",
    "provider.connected": "server.provider.connected",
    "provider.disconnected": "server.provider.disconnected",
}

MOCK_TYPE_MAP = {
    "provider.connected": "server.provider.connected",
    "provider.disconnected": "server.provider.disconnected",
    "provider.error": "server.provider.error",
    "transcript.delta": "server.transcript.delta",
    "transcript.final": "server.transcript.final",
    "assistant.text_delta": "server.assistant.text_delta",
    "assistant.text_final": "server.assistant.text_final",
    "assistant.audio_delta": "server.assistant.audio_delta",
    "assistant.audio_started": "server.assistant.audio_started",
    "assistant.audio_completed": "server.assistant.audio_completed",
    "response.interrupted": "server.response.interrupted",
    "audio.buffer_committed": "server.audio.buffer_committed",
}


def map_realtime_event(session_id: str, event: RealtimeEvent) -> ServerMessage:
    event_type = MOCK_TYPE_MAP.get(event.type) or OPENAI_TYPE_MAP.get(event.type) or "server.provider.error"
    payload = dict(event.payload)
    payload["provider"] = event.provider
    payload["raw_provider_event_type"] = event.type
    if "delta" in payload and "text" not in payload:
        payload["text"] = payload["delta"]
    if "audio" not in payload and "delta" in payload and event_type == "server.assistant.audio_delta":
        payload["audio"] = payload["delta"]
    if event.latency_ms is not None:
        payload["latency_ms"] = event.latency_ms
    return server_event(event_type, session_id, payload)
