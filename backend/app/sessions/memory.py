import uuid
from datetime import datetime, timezone
from types import SimpleNamespace

from app.core.config import settings

_sessions: dict[str, SimpleNamespace] = {}
_events: dict[str, list[dict]] = {}
_metrics: dict[str, list[dict]] = {}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(session: SimpleNamespace) -> dict:
    events = _events.get(session.id, [])
    metrics = _metrics.get(session.id, [])
    latencies = [metric["value_ms"] for metric in metrics if metric["value_ms"] > 0]
    user_turns = len([event for event in events if event["event_type"] in {"server.transcript.final", "transcript.final"}])
    assistant_turns = len([event for event in events if event["event_type"] == "server.assistant.text_final"])
    errors = len([event for event in events if "error" in event["event_type"]])
    return {
        "id": session.id,
        "status": session.status,
        "transport": session.transport,
        "provider": session.provider,
        "model": session.model,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "last_heartbeat_at": session.last_heartbeat_at.isoformat() if session.last_heartbeat_at else None,
        "metadata": {
            **session.meta,
            "event_count": len(events),
            "latency_metric_count": len(metrics),
            "user_turns": user_turns,
            "assistant_turns": assistant_turns,
            "error_count": errors,
            "average_latency_ms": int(sum(latencies) / len(latencies)) if latencies else 0,
        },
    }


def create_session() -> dict:
    session_id = str(uuid.uuid4())
    session = SimpleNamespace(
        id=session_id,
        status="created",
        transport="websocket",
        provider=settings.provider_name,
        model=settings.openai_realtime_model,
        created_at=_now(),
        updated_at=_now(),
        started_at=None,
        ended_at=None,
        last_heartbeat_at=None,
        meta={"storage": "memory_fallback"},
    )
    _sessions[session_id] = session
    log_event(session_id, "session.created", "internal", {"provider": session.provider, "storage": "memory_fallback"})
    log_metric(session_id, "session_create_ms", 0, session.provider)
    return _serialize(session)


def list_sessions() -> dict:
    sessions = list(_sessions.values())
    active = [s for s in sessions if s.status not in {"ended", "failed"}]
    completed = [s for s in sessions if s.status == "ended"]
    failed = [s for s in sessions if s.status == "failed"]
    all_metrics = [metric for session_id in _sessions for metric in _metrics.get(session_id, [])]

    def average_metric(name: str) -> int:
        values = [metric["value_ms"] for metric in all_metrics if metric["metric_name"] == name and metric["value_ms"] > 0]
        return int(sum(values) / len(values)) if values else 0

    durations = [
        int((s.ended_at - s.started_at).total_seconds())
        for s in sessions
        if s.started_at and s.ended_at
    ]
    return {
        "summary": {
            "active_sessions": len(active),
            "completed_sessions": len(completed),
            "failed_sessions": len(failed),
            "average_session_duration": int(sum(durations) / len(durations)) if durations else 0,
            "average_first_transcript_latency": average_metric("first_transcript_delta_ms") or average_metric("final_transcript_ms"),
            "average_assistant_response_latency": average_metric("assistant_first_text_delta_ms") or average_metric("assistant_first_audio_delta_ms"),
            "total_events": sum(len(_events.get(session.id, [])) for session in sessions),
            "total_latency_samples": len(all_metrics),
        },
        "sessions": [_serialize(session) for session in sorted(sessions, key=lambda item: item.created_at, reverse=True)],
    }


def get_session(session_id: str) -> SimpleNamespace:
    return _sessions[session_id]


def has_session(session_id: str) -> bool:
    return session_id in _sessions


def get_session_dict(session_id: str) -> dict:
    return _serialize(get_session(session_id))


def update_status(session_id: str, status: str) -> SimpleNamespace:
    session = get_session(session_id)
    session.status = status
    session.updated_at = _now()
    if status in {"connected", "listening"} and session.started_at is None:
        session.started_at = _now()
    if status in {"ended", "failed"}:
        session.ended_at = _now()
    return session


def heartbeat(session_id: str) -> None:
    session = get_session(session_id)
    session.last_heartbeat_at = _now()


def log_event(session_id: str, event_type: str, direction: str, payload: dict, sequence_number: int | None = None) -> None:
    _events.setdefault(session_id, []).append(
        {
            "id": str(uuid.uuid4()),
            "event_type": event_type,
            "direction": direction,
            "payload": payload,
            "sequence_number": sequence_number,
            "created_at": _now().isoformat(),
        }
    )


def log_metric(session_id: str, metric_name: str, value_ms: int, provider: str | None = None) -> None:
    _metrics.setdefault(session_id, []).append(
        {
            "id": str(uuid.uuid4()),
            "metric_name": metric_name,
            "value_ms": value_ms,
            "provider": provider,
            "turn_index": None,
            "created_at": _now().isoformat(),
        }
    )


def list_events(session_id: str) -> list[dict]:
    return _events.get(session_id, [])


def list_metrics(session_id: str) -> list[dict]:
    return _metrics.get(session_id, [])


class ResilientSessionRepository:
    def __init__(self, repo):
        self.repo = repo

    async def _rollback(self) -> None:
        await self.repo.db.rollback()

    async def get(self, session_id: str):
        if has_session(session_id):
            return get_session(session_id)
        try:
            return await self.repo.get(session_id)
        except Exception:
            await self._rollback()
            return get_session(session_id)

    async def update_status(self, session_id: str, status: str):
        if has_session(session_id):
            return update_status(session_id, status)
        try:
            return await self.repo.update_status(session_id, status)
        except Exception:
            await self._rollback()
            return update_status(session_id, status)

    async def heartbeat(self, session_id: str) -> None:
        if has_session(session_id):
            heartbeat(session_id)
            return
        try:
            await self.repo.heartbeat(session_id)
        except Exception:
            await self._rollback()
            heartbeat(session_id)


class ResilientEventLogger:
    def __init__(self, logger):
        self.logger = logger

    async def _rollback(self) -> None:
        await self.logger.db.rollback()

    async def log_event(self, session_id: str, event_type: str, direction: str, payload: dict, sequence_number: int | None = None) -> None:
        log_event(session_id, event_type, direction, payload, sequence_number)
        if has_session(session_id):
            return
        try:
            await self.logger.log_event(session_id, event_type, direction, payload, sequence_number)
        except Exception:
            await self._rollback()

    async def log_audio_event(self, session_id: str, event_type: str, sequence_number: int | None, sample_rate: int | None, encoding: str | None, frame_size_bytes: int | None, buffer_depth_ms: int | None = None) -> None:
        await self.log_event(session_id, event_type, "audio", {"sample_rate": sample_rate, "encoding": encoding, "frame_size_bytes": frame_size_bytes, "buffer_depth_ms": buffer_depth_ms}, sequence_number)

    async def log_transcript(self, session_id: str, speaker: str, text: str, is_final: bool, provider: str) -> None:
        await self.log_event(session_id, "transcript.final" if is_final else "transcript.delta", "provider", {"speaker": speaker, "text": text, "provider": provider})

    async def log_latency(self, session_id: str, metric_name: str, value_ms: int, provider: str | None = None) -> None:
        log_metric(session_id, metric_name, value_ms, provider)
        if has_session(session_id):
            return
        try:
            await self.logger.log_latency(session_id, metric_name, value_ms, provider)
        except Exception:
            await self._rollback()
