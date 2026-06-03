from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.cors import install_cors
from app.middleware.request_id import request_id_middleware

configure_logging()

app = FastAPI(
    title="VoiceOps Gateway",
    version="0.1.0",
    description="Realtime audio gateway and observability platform for AI voice agents.",
)
app.middleware("http")(request_id_middleware)
install_cors(app)
app.include_router(api_router)


@app.get("/")
async def root() -> dict:
    return {
        "name": "VoiceOps Gateway",
        "env": settings.app_env,
        "provider": settings.provider_name,
    }
