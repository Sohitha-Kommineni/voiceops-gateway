import asyncio
import logging
import time

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.audio.validation import decode_and_validate_audio
from app.core.config import settings
from app.core.errors import InvalidAudioChunkError, ProviderConnectionError
from app.events.logger import EventLogger
from app.metrics.collector import metrics_collector
from app.realtime.event_mapper import map_realtime_event
from app.realtime.mock_provider import MockRealtimeProvider
from app.realtime.openai_provider import OpenAIRealtimeProvider
from app.realtime.provider import RealtimeProvider
from app.realtime.session_config import build_realtime_config
from app.sessions.repository import SessionRepository
from app.sessions.manager import session_manager
from app.sessions.memory import ResilientEventLogger, ResilientSessionRepository, has_session
from app.sessions.state_machine import SessionState, transition
from app.storage.database import get_db
from app.ws.connection_manager import connection_manager
from app.ws.protocol import parse_client_message, server_event
from app.ws.serializers import serialize_server_message

logger = logging.getLogger(__name__)
router = APIRouter()


def provider_for_env() -> RealtimeProvider:
    if settings.mock_realtime or not settings.openai_api_key:
        return MockRealtimeProvider()
    return OpenAIRealtimeProvider()


async def send(session_id: str, event_type: str, payload: dict, sequence_number: int | None = None) -> None:
    await connection_manager.send_json_text(
        session_id,
        serialize_server_message(server_event(event_type, session_id, payload, sequence_number)),
    )


async def safe_commit(db: AsyncSession, session_id: str) -> None:
    if has_session(session_id):
        return
    try:
        await db.commit()
    except Exception:
        await db.rollback()


@router.websocket("/ws/v1/sessions/{session_id}/audio")
async def session_audio_gateway(
    websocket: WebSocket,
    session_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = ResilientSessionRepository(SessionRepository(db))
    event_logger = ResilientEventLogger(EventLogger(db))
    provider = provider_for_env()
    current_state = SessionState.CREATED
    provider_task: asyncio.Task | None = None
    emitted_latency_metrics: set[str] = set()

    await connection_manager.connect(session_id, websocket)
    try:
        session = await repo.get(session_id)
        current_state = SessionState(session.status)
        current_state = transition(current_state, SessionState.CONNECTING)
        await repo.update_status(session_id, current_state.value)
        await session_manager.set_live_state(session_id, current_state.value, provider.name)
        await event_logger.log_event(session_id, "ws.connected", "inbound", {"transport": "websocket"})
        await safe_commit(db, session_id)
        await send(session_id, "server.session.started", {"status": current_state.value, "provider": provider.name})

        current_state = transition(current_state, SessionState.PROVIDER_CONNECTING)
        await repo.update_status(session_id, current_state.value)
        await session_manager.set_live_state(session_id, current_state.value, provider.name)
        await send(session_id, "server.session.state_changed", {"state": current_state.value})
        await safe_commit(db, session_id)

        await provider.connect(session_id, build_realtime_config())
        current_state = transition(current_state, SessionState.CONNECTED)
        await repo.update_status(session_id, current_state.value)
        await session_manager.set_live_state(session_id, current_state.value, provider.name)
        await send(session_id, "server.session.state_changed", {"state": current_state.value})
        current_state = transition(current_state, SessionState.LISTENING)
        await repo.update_status(session_id, current_state.value)
        await session_manager.set_live_state(session_id, current_state.value, provider.name)
        await send(session_id, "server.session.state_changed", {"state": current_state.value})
        await safe_commit(db, session_id)

        async def pump_provider_events() -> None:
            nonlocal current_state
            async for realtime_event in provider.stream_events(session_id):
                normalized = map_realtime_event(session_id, realtime_event)
                state_changed_to: str | None = None
                await event_logger.log_event(
                    session_id,
                    normalized.type,
                    "provider",
                    normalized.payload,
                    normalized.sequence_number,
                )
                if normalized.type == "server.transcript.delta" and current_state == SessionState.USER_SPEAKING:
                    current_state = transition(current_state, SessionState.TRANSCRIBING)
                    await repo.update_status(session_id, current_state.value)
                    await session_manager.set_live_state(session_id, current_state.value, provider.name)
                    state_changed_to = current_state.value
                if normalized.type == "server.transcript.final" and current_state == SessionState.TRANSCRIBING:
                    current_state = transition(current_state, SessionState.ASSISTANT_THINKING)
                    await repo.update_status(session_id, current_state.value)
                    await session_manager.set_live_state(session_id, current_state.value, provider.name)
                    state_changed_to = current_state.value
                    await event_logger.log_transcript(session_id, "user", normalized.payload.get("text", ""), True, realtime_event.provider)
                if normalized.type == "server.assistant.text_delta" and current_state == SessionState.ASSISTANT_THINKING:
                    current_state = transition(current_state, SessionState.ASSISTANT_SPEAKING)
                    await repo.update_status(session_id, current_state.value)
                    await session_manager.set_live_state(session_id, current_state.value, provider.name)
                    state_changed_to = current_state.value
                if normalized.type == "server.assistant.audio_completed" and current_state == SessionState.ASSISTANT_SPEAKING:
                    current_state = transition(current_state, SessionState.LISTENING)
                    await repo.update_status(session_id, current_state.value)
                    await session_manager.set_live_state(session_id, current_state.value, provider.name)
                    state_changed_to = current_state.value
                if normalized.type == "server.response.interrupted":
                    metrics_collector.barge_in()
                should_emit_metric = False
                metric_name = "provider_event_latency_ms"
                if "latency_ms" in normalized.payload:
                    if normalized.type == "server.transcript.delta":
                        metric_name = "first_transcript_delta_ms"
                    elif normalized.type == "server.transcript.final":
                        metric_name = "final_transcript_ms"
                    elif normalized.type == "server.assistant.text_delta":
                        metric_name = "assistant_first_text_delta_ms"
                    elif normalized.type == "server.assistant.audio_delta":
                        metric_name = "assistant_first_audio_delta_ms"
                    should_emit_metric = metric_name not in emitted_latency_metrics or metric_name == "provider_event_latency_ms"
                    if should_emit_metric:
                        emitted_latency_metrics.add(metric_name)
                        await event_logger.log_latency(session_id, metric_name, int(normalized.payload["latency_ms"]), realtime_event.provider)
                await safe_commit(db, session_id)
                if state_changed_to:
                    await send(session_id, "server.session.state_changed", {"state": state_changed_to})
                if "latency_ms" in normalized.payload and should_emit_metric:
                    await send(
                        session_id,
                        "server.latency.update",
                        {
                            "metric_name": metric_name,
                            "value_ms": int(normalized.payload["latency_ms"]),
                            "provider": realtime_event.provider,
                            "source_event_type": normalized.type,
                        },
                    )
                await connection_manager.send_json_text(session_id, serialize_server_message(normalized))

        provider_task = asyncio.create_task(pump_provider_events())

        while True:
            raw = await websocket.receive_text()
            try:
                message = parse_client_message(raw)
            except ValueError as exc:
                await send(session_id, "server.session.error", {"message": str(exc)})
                continue

            await event_logger.log_event(session_id, message.type, "inbound", message.payload, message.sequence_number)
            if message.type == "client.audio.chunk" and message.audio:
                ingest_started = time.perf_counter()
                audio_bytes = decode_and_validate_audio(message.audio)
                metrics_collector.audio_chunk_received()
                if current_state == SessionState.LISTENING:
                    current_state = transition(current_state, SessionState.USER_SPEAKING)
                    await repo.update_status(session_id, current_state.value)
                    await session_manager.set_live_state(session_id, current_state.value, provider.name)
                    await send(session_id, "server.session.state_changed", {"state": current_state.value})
                await event_logger.log_audio_event(
                    session_id,
                    "audio.chunk.received",
                    message.audio.sequence_number,
                    message.audio.sample_rate,
                    message.audio.encoding,
                    len(audio_bytes),
                )
                await provider.send_audio_chunk(session_id, message.audio)
                ingest_ms = max(1, int((time.perf_counter() - ingest_started) * 1000))
                await event_logger.log_latency(session_id, "audio_frame_ingest_ms", ingest_ms, provider.name)
                await send(
                    session_id,
                    "server.latency.update",
                    {
                        "metric_name": "audio_frame_ingest_ms",
                        "value_ms": ingest_ms,
                        "provider": provider.name,
                        "source_event_type": "client.audio.chunk",
                    },
                    message.audio.sequence_number,
                )
                await send(session_id, "server.audio.received", {"bytes": len(audio_bytes)}, message.audio.sequence_number)
            elif message.type == "client.audio.stop":
                await provider.commit_audio_buffer(session_id)
            elif message.type == "client.response.interrupt":
                if current_state == SessionState.ASSISTANT_SPEAKING:
                    current_state = transition(current_state, SessionState.INTERRUPTED)
                    await repo.update_status(session_id, current_state.value)
                    await session_manager.set_live_state(session_id, current_state.value, provider.name)
                    await send(session_id, "server.session.state_changed", {"state": current_state.value})
                await provider.interrupt_response(session_id)
                await event_logger.log_event(session_id, "response.interrupted", "internal", {"reason": "barge_in"})
                if current_state == SessionState.INTERRUPTED:
                    current_state = transition(current_state, SessionState.LISTENING)
                    await repo.update_status(session_id, current_state.value)
                    await session_manager.set_live_state(session_id, current_state.value, provider.name)
                    await send(session_id, "server.session.state_changed", {"state": current_state.value})
            elif message.type == "client.heartbeat":
                await repo.heartbeat(session_id)
                await send(session_id, "server.heartbeat_ack", {"ok": True})
            elif message.type == "client.session.close":
                break
            await safe_commit(db, session_id)

    except WebSocketDisconnect:
        logger.info("websocket disconnected", extra={"session_id": session_id})
    except (InvalidAudioChunkError, ProviderConnectionError) as exc:
        await event_logger.log_event(session_id, "session.error", "internal", {"message": str(exc)})
        try:
            await send(session_id, "server.session.error", {"message": str(exc)})
        except Exception:
            pass
        await repo.update_status(session_id, "failed")
        metrics_collector.session_failed()
        await safe_commit(db, session_id)
    finally:
        if provider_task:
            provider_task.cancel()
        await provider.close(session_id)
        connection_manager.disconnect(session_id)
        try:
            latest = await repo.get(session_id)
            if latest.status not in {"ended", "failed"}:
                await repo.update_status(session_id, "ended")
                await session_manager.set_live_state(session_id, "ended", provider.name)
                metrics_collector.session_ended()
                await event_logger.log_event(session_id, "session.ended", "internal", {})
                await safe_commit(db, session_id)
        except Exception:
            await db.rollback()
