import pytest

from app.core.errors import InvalidStateTransitionError
from app.sessions.state_machine import SessionState, transition


def test_allowed_state_machine_path() -> None:
    state = SessionState.CREATED
    for target in [
        SessionState.CONNECTING,
        SessionState.PROVIDER_CONNECTING,
        SessionState.CONNECTED,
        SessionState.LISTENING,
        SessionState.USER_SPEAKING,
        SessionState.TRANSCRIBING,
        SessionState.ASSISTANT_THINKING,
        SessionState.ASSISTANT_SPEAKING,
        SessionState.INTERRUPTED,
        SessionState.LISTENING,
        SessionState.ENDING,
        SessionState.ENDED,
    ]:
        state = transition(state, target)
    assert state == SessionState.ENDED


def test_invalid_transition_is_rejected() -> None:
    with pytest.raises(InvalidStateTransitionError):
        transition(SessionState.CREATED, SessionState.ASSISTANT_SPEAKING)
