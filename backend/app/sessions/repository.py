import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import SessionNotFoundError
from app.sessions.models import LatencyMetric, VoiceSession


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, provider: str, model: str | None, user_id: str | None = None) -> VoiceSession:
        session = VoiceSession(
            id=uuid.uuid4(),
            user_id=uuid.UUID(user_id) if user_id else None,
            status="created",
            transport="websocket",
            provider=provider,
            model=model,
            meta={},
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def get(self, session_id: str) -> VoiceSession:
        result = await self.db.execute(select(VoiceSession).where(VoiceSession.id == uuid.UUID(session_id)))
        session = result.scalar_one_or_none()
        if not session:
            raise SessionNotFoundError(session_id)
        return session

    async def list(self) -> list[VoiceSession]:
        result = await self.db.execute(select(VoiceSession).order_by(VoiceSession.created_at.desc()).limit(200))
        return list(result.scalars())

    async def update_status(self, session_id: str, status: str) -> VoiceSession:
        session = await self.get(session_id)
        session.status = status
        session.updated_at = datetime.now(timezone.utc)
        if status in {"connected", "listening"} and session.started_at is None:
            session.started_at = datetime.now(timezone.utc)
        if status in {"ended", "failed"}:
            session.ended_at = datetime.now(timezone.utc)
        await self.db.flush()
        return session

    async def heartbeat(self, session_id: str) -> None:
        session = await self.get(session_id)
        session.last_heartbeat_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def dashboard_summary(self) -> dict:
        sessions = (await self.db.execute(select(VoiceSession))).scalars().all()
        active = [s for s in sessions if s.status not in {"ended", "failed"}]
        completed = [s for s in sessions if s.status == "ended"]
        failed = [s for s in sessions if s.status == "failed"]
        durations = [
            (s.ended_at - s.started_at).total_seconds()
            for s in sessions
            if s.started_at and s.ended_at
        ]
        metrics_result = await self.db.execute(select(LatencyMetric.metric_name, func.avg(LatencyMetric.value_ms)).group_by(LatencyMetric.metric_name))
        averages = {name: int(value or 0) for name, value in metrics_result.all()}
        return {
            "active_sessions": len(active),
            "completed_sessions": len(completed),
            "failed_sessions": len(failed),
            "average_session_duration": int(sum(durations) / len(durations)) if durations else 0,
            "average_first_transcript_latency": averages.get("first_transcript_delta_ms", 0),
            "average_assistant_response_latency": averages.get("assistant_first_text_delta_ms", 0),
        }
