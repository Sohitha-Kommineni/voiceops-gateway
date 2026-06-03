from app.realtime.mock_provider import MockRealtimeProvider
from app.realtime.session_config import build_realtime_config
from app.ws.schemas import AudioChunk


async def test_mock_provider_emits_transcript_after_audio() -> None:
    provider = MockRealtimeProvider()
    session_id = "00000000-0000-0000-0000-000000000001"
    await provider.connect(session_id, build_realtime_config())
    stream = provider.stream_events(session_id)
    first = await anext(stream)
    assert first.type == "provider.connected"
    audio = AudioChunk(
        session_id=session_id,
        sequence_number=0,
        timestamp=1,
        sample_rate=24000,
        encoding="pcm16",
        payload="AAAA",
    )
    for index in range(6):
        audio.sequence_number = index
        await provider.send_audio_chunk(session_id, audio)
    event = await anext(stream)
    assert event.type == "transcript.delta"
