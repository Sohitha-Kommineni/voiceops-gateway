import base64

from app.core.config import settings
from app.core.errors import InvalidAudioChunkError
from app.ws.schemas import AudioChunk


def decode_and_validate_audio(chunk: AudioChunk) -> bytes:
    try:
        data = base64.b64decode(chunk.payload, validate=True)
    except Exception as exc:
        raise InvalidAudioChunkError("audio payload must be valid base64") from exc
    if not data:
        raise InvalidAudioChunkError("audio chunk is empty")
    if len(data) > settings.max_audio_chunk_bytes:
        raise InvalidAudioChunkError("audio chunk exceeds max size")
    if chunk.encoding == "pcm16" and len(data) % 2 != 0:
        raise InvalidAudioChunkError("pcm16 payload must have even byte length")
    return data
