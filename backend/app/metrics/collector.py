from app.metrics import prometheus


class MetricsCollector:
    def session_created(self) -> None:
        prometheus.total_sessions.inc()
        prometheus.active_sessions.inc()

    def session_ended(self) -> None:
        prometheus.active_sessions.dec()

    def session_failed(self) -> None:
        prometheus.failed_sessions.inc()

    def audio_chunk_received(self) -> None:
        prometheus.audio_chunks_received.inc()

    def barge_in(self) -> None:
        prometheus.barge_ins.inc()


metrics_collector = MetricsCollector()
