from enum import StrEnum

from app.core.errors import InvalidStateTransitionError


class SessionState(StrEnum):
    CREATED = "created"
    CONNECTING = "connecting"
    PROVIDER_CONNECTING = "provider_connecting"
    CONNECTED = "connected"
    LISTENING = "listening"
    USER_SPEAKING = "user_speaking"
    TRANSCRIBING = "transcribing"
    ASSISTANT_THINKING = "assistant_thinking"
    ASSISTANT_SPEAKING = "assistant_speaking"
    INTERRUPTED = "interrupted"
    RECONNECTING = "reconnecting"
    ENDING = "ending"
    ENDED = "ended"
    FAILED = "failed"


ACTIVE_STATES = {
    SessionState.CONNECTING,
    SessionState.PROVIDER_CONNECTING,
    SessionState.CONNECTED,
    SessionState.LISTENING,
    SessionState.USER_SPEAKING,
    SessionState.TRANSCRIBING,
    SessionState.ASSISTANT_THINKING,
    SessionState.ASSISTANT_SPEAKING,
    SessionState.INTERRUPTED,
    SessionState.RECONNECTING,
}

ALLOWED_TRANSITIONS: dict[SessionState, set[SessionState]] = {
    SessionState.CREATED: {SessionState.CONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.CONNECTING: {SessionState.PROVIDER_CONNECTING, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.PROVIDER_CONNECTING: {SessionState.CONNECTED, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.CONNECTED: {SessionState.LISTENING, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.LISTENING: {SessionState.USER_SPEAKING, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.USER_SPEAKING: {SessionState.TRANSCRIBING, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.TRANSCRIBING: {SessionState.ASSISTANT_THINKING, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.ASSISTANT_THINKING: {SessionState.ASSISTANT_SPEAKING, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.ASSISTANT_SPEAKING: {SessionState.INTERRUPTED, SessionState.LISTENING, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.INTERRUPTED: {SessionState.LISTENING, SessionState.RECONNECTING, SessionState.ENDING, SessionState.FAILED},
    SessionState.RECONNECTING: {SessionState.CONNECTED, SessionState.FAILED, SessionState.ENDING},
    SessionState.ENDING: {SessionState.ENDED},
    SessionState.ENDED: set(),
    SessionState.FAILED: set(),
}


def transition(current: str | SessionState, target: str | SessionState) -> SessionState:
    current_state = SessionState(current)
    target_state = SessionState(target)
    if target_state not in ALLOWED_TRANSITIONS[current_state]:
        raise InvalidStateTransitionError(f"{current_state.value} -> {target_state.value} is not allowed")
    return target_state
