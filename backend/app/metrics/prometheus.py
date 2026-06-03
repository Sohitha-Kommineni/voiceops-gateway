from prometheus_client import Counter, Gauge, Histogram, generate_latest

active_sessions = Gauge("voiceops_active_sessions", "Active voice sessions")
total_sessions = Counter("voiceops_total_sessions", "Total voice sessions")
failed_sessions = Counter("voiceops_failed_sessions", "Failed voice sessions")
audio_chunks_received = Counter("voiceops_audio_chunks_received_total", "Audio chunks received")
ws_connections_active = Gauge("voiceops_ws_connections_active", "Active WebSocket connections")
provider_errors = Counter("voiceops_provider_errors_total", "Provider errors")
barge_ins = Counter("voiceops_barge_ins_total", "Barge-in interruptions")
session_duration = Histogram("voiceops_session_duration_seconds", "Session duration seconds")
turn_latency = Histogram("voiceops_turn_latency_seconds", "Turn latency seconds")
transcript_latency = Histogram("voiceops_transcript_latency_seconds", "Transcript latency seconds")
assistant_audio_latency = Histogram("voiceops_assistant_audio_latency_seconds", "Assistant audio latency seconds")


def metrics_response() -> bytes:
    return generate_latest()
