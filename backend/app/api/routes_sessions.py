from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import SessionNotFoundError
from app.core.config import settings
from app.events.repository import EventRepository
from app.middleware.rate_limit import session_create_rate_limit
from app.sessions import memory
from app.sessions.service import SessionService
from app.storage.database import get_db

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


@router.post("", dependencies=[Depends(session_create_rate_limit)])
async def create_session(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    if settings.local_memory_fallback:
        return memory.create_session()
    try:
        return await SessionService(db).create_session()
    except Exception:
        await db.rollback()
        return memory.create_session()


@router.get("")
async def list_sessions(db: AsyncSession = Depends(get_db)) -> dict:
    if settings.local_memory_fallback:
        return memory.list_sessions()
    try:
        return await SessionService(db).list_sessions()
    except Exception:
        await db.rollback()
        return memory.list_sessions()


@router.get("/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    if settings.local_memory_fallback:
        try:
            return memory.get_session_dict(session_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="session not found")
    try:
        return await SessionService(db).get_session(session_id)
    except Exception:
        await db.rollback()
        try:
            return memory.get_session_dict(session_id)
        except KeyError:
            raise HTTPException(status_code=404, detail="session not found")


@router.get("/{session_id}/events")
async def get_events(session_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    if settings.local_memory_fallback:
        return {"events": memory.list_events(session_id)}
    try:
        events = await EventRepository(db).list_events(session_id)
    except Exception:
        await db.rollback()
        return {"events": memory.list_events(session_id)}
    return {
        "events": [
            {
                "id": str(event.id),
                "event_type": event.event_type,
                "direction": event.direction,
                "payload": event.payload,
                "sequence_number": event.sequence_number,
                "created_at": event.created_at.isoformat() if event.created_at else None,
            }
            for event in events
        ]
    }


@router.get("/{session_id}/metrics")
async def get_metrics(session_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    if settings.local_memory_fallback:
        return {"metrics": memory.list_metrics(session_id)}
    try:
        metrics = await EventRepository(db).list_metrics(session_id)
    except Exception:
        await db.rollback()
        return {"metrics": memory.list_metrics(session_id)}
    return {
        "metrics": [
            {
                "id": str(metric.id),
                "metric_name": metric.metric_name,
                "value_ms": metric.value_ms,
                "provider": metric.provider,
                "turn_index": metric.turn_index,
                "created_at": metric.created_at.isoformat() if metric.created_at else None,
            }
            for metric in metrics
        ]
    }


@router.delete("/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)) -> dict:
    if settings.local_memory_fallback:
        return memory._serialize(memory.update_status(session_id, "ended"))
    try:
        return await SessionService(db).end_session(session_id)
    except Exception:
        await db.rollback()
        return memory._serialize(memory.update_status(session_id, "ended"))
