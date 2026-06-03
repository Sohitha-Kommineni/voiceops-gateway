import base64

import pytest

from app.audio.validation import decode_and_validate_audio
from app.core.errors import InvalidAudioChunkError
from app.ws.schemas import AudioChunk


def chunk(payload: str) -> AudioChunk:
    return AudioChunk(
        session_id="00000000-0000-0000-0000-000000000001",
        sequence_number=1,
        timestamp=1,
        sample_rate=24000,
        encoding="pcm16",
        payload=payload,
    )


def test_valid_pcm16_chunk_decodes() -> None:
    payload = base64.b64encode(b"\x01\x00\x02\x00").decode()
    assert decode_and_validate_audio(chunk(payload)) == b"\x01\x00\x02\x00"


def test_invalid_base64_rejected() -> None:
    with pytest.raises(InvalidAudioChunkError):
        decode_and_validate_audio(chunk("not base64***"))


def test_odd_pcm16_byte_count_rejected() -> None:
    payload = base64.b64encode(b"\x01").decode()
    with pytest.raises(InvalidAudioChunkError):
        decode_and_validate_audio(chunk(payload))
