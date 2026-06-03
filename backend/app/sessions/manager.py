import json
from datetime import datetime, timezone

from app.sessions.state_machine import SessionState, transition
from app.storage.redis import redis_client


class SessionManager:
    key_prefix = "voiceops:session:"
    memory: dict[str, dict] = {}

    async def set_live_state(self, session_id: str, state: str, provider: str) -> None:
        mapping = {
            "state": state,
            "provider": provider,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        from app.sessions.memory import has_session

        if has_session(session_id):
            self.memory[session_id] = mapping
            return
        try:
            await redis_client.hset(self.key_prefix + session_id, mapping=mapping)
        except Exception:
            self.memory[session_id] = mapping

    async def get_live_state(self, session_id: str) -> dict:
        try:
            return dict(await redis_client.hgetall(self.key_prefix + session_id))
        except Exception:
            return self.memory.get(session_id, {})

    async def transition(self, session_id: str, current: str, target: str, provider: str) -> SessionState:
        next_state = transition(current, target)
        await self.set_live_state(session_id, next_state.value, provider)
        return next_state

    async def append_trace(self, session_id: str, event: dict) -> None:
        try:
            await redis_client.rpush(f"{self.key_prefix}{session_id}:trace", json.dumps(event))
            await redis_client.ltrim(f"{self.key_prefix}{session_id}:trace", -500, -1)
        except Exception:
            pass


session_manager = SessionManager()
