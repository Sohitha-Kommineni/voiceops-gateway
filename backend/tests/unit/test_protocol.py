from app.ws.protocol import parse_client_message


def test_parse_client_message() -> None:
    message = parse_client_message('{"type":"client.heartbeat","session_id":"s1","payload":{}}')
    assert message.type == "client.heartbeat"
    assert message.session_id == "s1"
