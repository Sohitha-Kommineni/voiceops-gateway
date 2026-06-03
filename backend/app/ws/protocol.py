import time

from pydantic import ValidationError

from app.ws.schemas import ClientMessage, ServerMessage, ServerMessageType


def now_ms() -> int:
    return int(time.time() * 1000)


def parse_client_message(raw: str) -> ClientMessage:
    try:
        return ClientMessage.model_validate_json(raw)
    except ValidationError as exc:
        raise ValueError(str(exc)) from exc


def server_event(
    event_type: ServerMessageType,
    session_id: str,
    payload: dict,
    sequence_number: int | None = None,
) -> ServerMessage:
    return ServerMessage(
        type=event_type,
        session_id=session_id,
        timestamp=now_ms(),
        sequence_number=sequence_number,
        payload=payload,
    )
