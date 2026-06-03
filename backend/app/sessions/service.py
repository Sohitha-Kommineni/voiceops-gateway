import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.events.logger import EventLogger
from app.metrics.collector import metrics_collector
from app.sessions.manager import session_manager
from app.sessions.repository import SessionRepository


def serialize_session(session) -> dict:
    return {
        "id": str(session.id),
        "status": session.status,
        "transport": session.transport,
        "provider": session.provider,
        "model": session.model,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "updated_at": session.updated_at.isoformat() if session.updated_at else None,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "last_heartbeat_at": session.last_heartbeat_at.isoformat() if session.last_heartbeat_at else None,
        "metadata": session.meta or {},
    }


class SessionService:
    def __init__(self, db: AsyncSession):
        self.repo = SessionRepository(db)
        self.logger = EventLogger(db)
        self.db = db

    async def create_session(self, user_id: str | None = None) -> dict:
        provider = settings.provider_name
        session = await self.repo.create(provider=provider, model=settings.openai_realtime_model, user_id=user_id)
        await session_manager.set_live_state(str(session.id), session.status, provider)
        await self.logger.log_event(str(session.id), "session.created", "internal", {"provider": provider})
        await self.logger.log_latency(str(session.id), "session_create_ms", 0, provider)
        metrics_collector.session_created()
        await self.db.commit()
        return serialize_session(session)

    async def list_sessions(self) -> dict:
        sessions = await self.repo.list()
        summary = await self.repo.dashboard_summary()
        return {"summary": summary, "sessions": [serialize_session(session) for session in sessions]}

    async def get_session(self, session_id: str) -> dict:
        session = await self.repo.get(session_id)
        return serialize_session(session)

    async def end_session(self, session_id: str) -> dict:
        session = await self.repo.update_status(session_id, "ended")
        await self.logger.log_event(session_id, "session.ended", "internal", {})
        metrics_collector.session_ended()
        await self.db.commit()
        return serialize_session(session)


def validate_uuid(session_id: str) -> None:
    uuid.UUID(session_id)
