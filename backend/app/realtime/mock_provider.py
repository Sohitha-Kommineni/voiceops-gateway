import asyncio
import base64
from collections import defaultdict
from collections.abc import AsyncIterator

from app.audio.pcm16 import tone_pcm16
from app.realtime.provider import RealtimeProvider
from app.realtime.session_config import RealtimeSessionConfig
from app.ws.schemas import AudioChunk, RealtimeEvent


class MockRealtimeProvider(RealtimeProvider):
    name = "Mock Realtime"

    def __init__(self) -> None:
        self.queues: dict[str, asyncio.Queue[RealtimeEvent]] = defaultdict(asyncio.Queue)
        self.frames: dict[str, int] = defaultdict(int)
        self.responded: set[str] = set()
        self.closed: set[str] = set()

    async def connect(self, session_id: str, config: RealtimeSessionConfig) -> None:
        self.closed.discard(session_id)
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="provider.connected", payload={"mock": True, "model": config.model}))

    async def send_audio_chunk(self, session_id: str, audio: AudioChunk) -> None:
        self.frames[session_id] += 1
        if self.frames[session_id] == 6:
            await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="transcript.delta", payload={"text": "I can hear audio coming through"}))
        if self.frames[session_id] == 18 and session_id not in self.responded:
            self.responded.add(session_id)
            await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="transcript.final", payload={"text": "I can hear audio coming through the gateway."}, latency_ms=220))
            await self._assistant_response(session_id)

    async def _assistant_response(self, session_id: str) -> None:
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="assistant.audio_started", payload={}))
        for word in ["Mock", "realtime", "is", "active.", "Audio", "frames", "are", "reaching", "the", "backend."]:
            await asyncio.sleep(0.08)
            await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="assistant.text_delta", payload={"text": word + " "}, latency_ms=120))
        audio = base64.b64encode(tone_pcm16(140, 24000)).decode("ascii")
        for index in range(6):
            await asyncio.sleep(0.04)
            await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="assistant.audio_delta", payload={"audio": audio, "sample_rate": 24000, "encoding": "pcm16", "index": index}, latency_ms=180))
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="assistant.text_final", payload={"text": "Mock realtime is active. Audio frames are reaching the backend."}))
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="assistant.audio_completed", payload={}))

    async def commit_audio_buffer(self, session_id: str) -> None:
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="audio.buffer_committed", payload={}))
        if self.frames[session_id] > 0 and session_id not in self.responded:
            self.responded.add(session_id)
            await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="transcript.delta", payload={"text": "I heard your microphone input"}))
            await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="transcript.final", payload={"text": "I heard your microphone input."}, latency_ms=180))
            await self._assistant_response(session_id)

    async def interrupt_response(self, session_id: str) -> None:
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="response.interrupted", payload={"reason": "barge_in"}, latency_ms=20))

    async def update_instructions(self, session_id: str, instructions: str) -> None:
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="session.instructions_updated", payload={"length": len(instructions)}))

    async def stream_events(self, session_id: str) -> AsyncIterator[RealtimeEvent]:
        while session_id not in self.closed:
            yield await self.queues[session_id].get()

    async def close(self, session_id: str) -> None:
        self.closed.add(session_id)
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="provider.disconnected", payload={}))
