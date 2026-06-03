from abc import ABC, abstractmethod
from collections.abc import AsyncIterator

from app.realtime.session_config import RealtimeSessionConfig
from app.ws.schemas import AudioChunk, RealtimeEvent


class RealtimeProvider(ABC):
    name: str

    @abstractmethod
    async def connect(self, session_id: str, config: RealtimeSessionConfig) -> None:
        raise NotImplementedError

    @abstractmethod
    async def send_audio_chunk(self, session_id: str, audio: AudioChunk) -> None:
        raise NotImplementedError

    @abstractmethod
    async def commit_audio_buffer(self, session_id: str) -> None:
        raise NotImplementedError

    @abstractmethod
    async def interrupt_response(self, session_id: str) -> None:
        raise NotImplementedError

    @abstractmethod
    async def update_instructions(self, session_id: str, instructions: str) -> None:
        raise NotImplementedError

    @abstractmethod
    def stream_events(self, session_id: str) -> AsyncIterator[RealtimeEvent]:
        raise NotImplementedError

    @abstractmethod
    async def close(self, session_id: str) -> None:
        raise NotImplementedError
