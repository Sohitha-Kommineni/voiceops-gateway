from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "local"
    log_level: str = "INFO"
    database_url: str = "postgresql+asyncpg://voiceops:voiceops@postgres:5432/voiceops"
    redis_url: str = "redis://redis:6379/0"
    openai_api_key: str = ""
    openai_realtime_model: str = "gpt-realtime"
    openai_realtime_voice: str = "alloy"
    openai_realtime_turn_detection: str = "server_vad"
    openai_realtime_input_audio_format: str = "pcm16"
    openai_realtime_output_audio_format: str = "pcm16"
    mock_realtime: bool = True
    cors_origins: str = "http://localhost:5173"
    jwt_secret: str = Field(default="change-me", min_length=8)
    prometheus_enabled: bool = True
    local_memory_fallback: bool = True
    max_audio_chunk_bytes: int = 128_000
    max_session_duration_seconds: int = 3600
    heartbeat_interval_seconds: int = 15
    stale_session_timeout_seconds: int = 45

    @property
    def provider_name(self) -> str:
        if self.mock_realtime or not self.openai_api_key:
            return "Mock Realtime"
        return "OpenAI Realtime"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
