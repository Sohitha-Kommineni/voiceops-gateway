import asyncio
import base64
import json
import logging
from collections.abc import AsyncIterator

import websockets

from app.core.config import settings
from app.core.errors import ProviderConnectionError
from app.realtime.provider import RealtimeProvider
from app.realtime.session_config import RealtimeSessionConfig
from app.ws.schemas import AudioChunk, RealtimeEvent

logger = logging.getLogger(__name__)


class OpenAIRealtimeProvider(RealtimeProvider):
    name = "OpenAI Realtime"

    def __init__(self) -> None:
        self.connections: dict[str, websockets.WebSocketClientProtocol] = {}
        self.queues: dict[str, asyncio.Queue[RealtimeEvent]] = {}

    async def connect(self, session_id: str, config: RealtimeSessionConfig) -> None:
        if not settings.openai_api_key:
            raise ProviderConnectionError("OPENAI_API_KEY is required for OpenAI Realtime")
        url = f"wss://api.openai.com/v1/realtime?model={config.model}"
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "OpenAI-Beta": "realtime=v1",
        }
        try:
            try:
                ws = await websockets.connect(url, additional_headers=headers, ping_interval=15)
            except TypeError:
                ws = await websockets.connect(url, extra_headers=headers, ping_interval=15)
        except Exception as exc:
            raise ProviderConnectionError(str(exc)) from exc
        self.connections[session_id] = ws
        self.queues[session_id] = asyncio.Queue()
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "instructions": config.instructions,
                "voice": config.voice,
                "turn_detection": {"type": config.turn_detection},
                "input_audio_format": config.input_audio_format,
                "output_audio_format": config.output_audio_format,
            },
        }))
        await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="provider.connected", payload={"model": config.model}))
        asyncio.create_task(self._reader(session_id, ws))

    async def _reader(self, session_id: str, ws: websockets.WebSocketClientProtocol) -> None:
        try:
            async for raw in ws:
                payload = json.loads(raw)
                await self.queues[session_id].put(RealtimeEvent(provider=self.name, type=payload.get("type", "unknown"), payload=payload))
        except Exception as exc:
            logger.exception("provider reader failed", extra={"session_id": session_id, "provider": self.name})
            await self.queues[session_id].put(RealtimeEvent(provider=self.name, type="provider.error", payload={"message": str(exc)}))

    async def send_audio_chunk(self, session_id: str, audio: AudioChunk) -> None:
        ws = self.connections[session_id]
        await ws.send(json.dumps({"type": "input_audio_buffer.append", "audio": audio.payload}))

    async def commit_audio_buffer(self, session_id: str) -> None:
        ws = self.connections[session_id]
        await ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
        await ws.send(json.dumps({"type": "response.create"}))

    async def interrupt_response(self, session_id: str) -> None:
        ws = self.connections[session_id]
        await ws.send(json.dumps({"type": "response.cancel"}))
        await ws.send(json.dumps({"type": "input_audio_buffer.clear"}))

    async def update_instructions(self, session_id: str, instructions: str) -> None:
        await self.connections[session_id].send(json.dumps({"type": "session.update", "session": {"instructions": instructions}}))

    async def stream_events(self, session_id: str) -> AsyncIterator[RealtimeEvent]:
        queue = self.queues[session_id]
        while True:
            yield await queue.get()

    async def close(self, session_id: str) -> None:
        ws = self.connections.pop(session_id, None)
        if ws:
            await ws.close()
        queue = self.queues.get(session_id)
        if queue:
            await queue.put(RealtimeEvent(provider=self.name, type="provider.disconnected", payload={}))
