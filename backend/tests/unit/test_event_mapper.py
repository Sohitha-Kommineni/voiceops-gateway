from app.realtime.event_mapper import map_realtime_event
from app.ws.schemas import RealtimeEvent


def test_maps_mock_transcript_delta() -> None:
    event = RealtimeEvent(provider="Mock Realtime", type="transcript.delta", payload={"text": "hello"})
    mapped = map_realtime_event("00000000-0000-0000-0000-000000000001", event)
    assert mapped.type == "server.transcript.delta"
    assert mapped.payload["text"] == "hello"
    assert mapped.payload["raw_provider_event_type"] == "transcript.delta"


def test_maps_openai_audio_delta() -> None:
    event = RealtimeEvent(provider="OpenAI Realtime", type="response.audio.delta", payload={"delta": "abc"})
    mapped = map_realtime_event("00000000-0000-0000-0000-000000000001", event)
    assert mapped.type == "server.assistant.audio_delta"
    assert mapped.payload["audio"] == "abc"
