import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.sessions.models import AudioEvent, LatencyMetric, ProviderError, SessionEvent, Transcript

logger = logging.getLogger(__name__)


class EventLogger:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        session_id: str,
        event_type: str,
        direction: str,
        payload: dict,
        sequence_number: int | None = None,
    ) -> None:
        self.db.add(
            SessionEvent(
                session_id=uuid.UUID(session_id),
                event_type=event_type,
                direction=direction,
                payload=payload,
                sequence_number=sequence_number,
            )
        )
        logger.info(
            "session event logged",
            extra={"session_id": session_id, "event_type": event_type},
        )

    async def log_audio_event(
        self,
        session_id: str,
        event_type: str,
        sequence_number: int | None,
        sample_rate: int | None,
        encoding: str | None,
        frame_size_bytes: int | None,
        buffer_depth_ms: int | None = None,
    ) -> None:
        self.db.add(
            AudioEvent(
                session_id=uuid.UUID(session_id),
                event_type=event_type,
                sequence_number=sequence_number,
                sample_rate=sample_rate,
                encoding=encoding,
                frame_size_bytes=frame_size_bytes,
                buffer_depth_ms=buffer_depth_ms,
            )
        )

    async def log_transcript(self, session_id: str, speaker: str, text: str, is_final: bool, provider: str) -> None:
        self.db.add(
            Transcript(
                session_id=uuid.UUID(session_id),
                speaker=speaker,
                text=text,
                is_final=is_final,
                provider=provider,
            )
        )

    async def log_latency(self, session_id: str, metric_name: str, value_ms: int, provider: str | None = None) -> None:
        self.db.add(
            LatencyMetric(
                session_id=uuid.UUID(session_id),
                metric_name=metric_name,
                value_ms=value_ms,
                provider=provider,
            )
        )

    async def log_provider_error(self, session_id: str, provider: str, message: str, payload: dict | None = None) -> None:
        self.db.add(
            ProviderError(
                session_id=uuid.UUID(session_id),
                provider=provider,
                message=message,
                payload=payload,
            )
        )
