from fastapi import APIRouter

from app.storage.redis import redis_ping

router = APIRouter()


@router.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}


@router.get("/readyz")
async def readyz() -> dict:
    return {"status": "ready", "redis": await redis_ping()}
