from fastapi import APIRouter

from app.api.routes_health import router as health_router
from app.api.routes_metrics import router as metrics_router
from app.api.routes_sessions import router as sessions_router
from app.ws.gateway import router as ws_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(metrics_router)
api_router.include_router(sessions_router)
api_router.include_router(ws_router)
