from app.ws.schemas import ServerMessage


def serialize_server_message(message: ServerMessage) -> str:
    return message.model_dump_json()
