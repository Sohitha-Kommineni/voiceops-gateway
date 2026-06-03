class VoiceOpsError(Exception):
    code = "voiceops_error"


class InvalidStateTransitionError(VoiceOpsError):
    code = "invalid_state_transition"


class InvalidAudioChunkError(VoiceOpsError):
    code = "invalid_audio_chunk"


class ProviderConnectionError(VoiceOpsError):
    code = "provider_connection_error"


class SessionNotFoundError(VoiceOpsError):
    code = "session_not_found"
