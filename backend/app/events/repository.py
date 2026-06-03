import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.sessions.models import LatencyMetric, SessionEvent


class EventRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_events(self, session_id: str) -> list[SessionEvent]:
        result = await self.db.execute(
            select(SessionEvent)
            .where(SessionEvent.session_id == uuid.UUID(session_id))
            .order_by(SessionEvent.created_at.asc())
        )
        return list(result.scalars())

    async def list_metrics(self, session_id: str) -> list[LatencyMetric]:
        result = await self.db.execute(
            select(LatencyMetric)
            .where(LatencyMetric.session_id == uuid.UUID(session_id))
            .order_by(LatencyMetric.created_at.asc())
        )
        return list(result.scalars())
