from pydantic import BaseModel

from app.core.config import settings

DEFAULT_INSTRUCTIONS = (
    "You are a concise, professional voice assistant. Speak naturally. Keep responses short unless "
    "the user asks for detail. If you do not know something, say so clearly."
)


class RealtimeSessionConfig(BaseModel):
    model: str
    voice: str
    instructions: str = DEFAULT_INSTRUCTIONS
    turn_detection: str
    input_audio_format: str
    output_audio_format: str


def build_realtime_config() -> RealtimeSessionConfig:
    return RealtimeSessionConfig(
        model=settings.openai_realtime_model,
        voice=settings.openai_realtime_voice,
        turn_detection=settings.openai_realtime_turn_detection,
        input_audio_format=settings.openai_realtime_input_audio_format,
        output_audio_format=settings.openai_realtime_output_audio_format,
    )
