# VoiceOps Gateway

Production-style realtime audio gateway and observability platform for AI voice agents.

VoiceOps Gateway is not a demo chatbot. It is an internal-operations style platform for running realtime voice sessions through a secure backend gateway, with session records, event timelines, latency metrics, provider state, mock-mode operation, and OpenAI Realtime support when credentials are configured.

## Why This Is Production-Grade

- Browser microphone capture uses `getUserMedia`, `AudioContext`, and an `AudioWorklet`.
- Audio chunks are streamed to FastAPI over a typed WebSocket protocol.
- OpenAI API keys stay server-side; the frontend only talks to VoiceOps Gateway.
- Mock Realtime mode works without an OpenAI API key for local development.
- Session lifecycle is enforced through a state machine.
- PostgreSQL stores sessions, events, transcripts, assistant messages, latency metrics, provider errors, and audio events.
- Redis stores live session state.
- Prometheus metrics and structured JSON logs are built in.
- The UI separates browser mic, frontend transport, backend session, provider, user speaking, and assistant speaking states.

## Architecture

```mermaid
flowchart LR
  Browser["Browser User"] --> Mic["getUserMedia Microphone"]
  Mic --> Worklet["AudioWorklet PCM16 Capture"]
  Worklet --> FEWS["Frontend WebSocket Client"]
  FEWS --> Gateway["FastAPI WebSocket Gateway"]
  Gateway --> Manager["Session Manager"]
  Manager --> Redis["Redis Live Session Cache"]
  Manager --> Postgres["PostgreSQL"]
  Gateway --> Provider{"Realtime Provider"}
  Provider --> Mock["Mock Realtime"]
  Provider --> OpenAI["OpenAI Realtime WebSocket"]
  Gateway --> EventLogger["Event Logger"]
  EventLogger --> Postgres
  Gateway --> Metrics["Metrics Collector"]
  Metrics --> Prometheus["Prometheus"]
  Prometheus --> Grafana["Grafana"]
```

## Realtime Event Flow

```mermaid
sequenceDiagram
  participant U as Browser
  participant A as AudioWorklet
  participant W as Frontend WS
  participant G as FastAPI Gateway
  participant P as Realtime Provider
  participant DB as PostgreSQL

  U->>G: POST /api/v1/sessions
  G->>DB: create voice_session
  U->>W: Start Session
  W->>G: WS /ws/v1/sessions/{id}/audio
  G->>P: connect + session config
  P-->>G: provider.connected
  A->>W: PCM16 frames + RMS level
  W->>G: client.audio.chunk
  G->>DB: audio_event + session_event
  G->>P: relay audio
  P-->>G: transcript/audio/text events
  G-->>W: normalized VoiceOps events
  W-->>U: transcripts, audio playback, timeline, metrics
```

## Local Setup

```bash
cp .env.example .env
docker compose up --build
```

Frontend: <http://localhost:5173>  
Backend health: <http://localhost:8000/healthz>  
Metrics: <http://localhost:8000/metrics>

## Mock Mode

Mock mode is enabled when `OPENAI_API_KEY` is empty or `MOCK_REALTIME=true`.

```bash
MOCK_REALTIME=true docker compose up --build
```

In mock mode, the backend accepts real microphone audio chunks, emits partial/final transcripts, assistant text deltas, placeholder PCM16 assistant audio, latency updates, and interruption events.

## Real OpenAI Realtime Setup

Set these in `.env`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=your-realtime-model
OPENAI_REALTIME_VOICE=alloy
MOCK_REALTIME=false
```

The backend opens the OpenAI Realtime WebSocket server-side and never exposes the key to the browser.

## Environment Variables

| Variable | Default |
| --- | --- |
| `APP_ENV` | `local` |
| `LOG_LEVEL` | `INFO` |
| `DATABASE_URL` | `postgresql+asyncpg://voiceops:voiceops@postgres:5432/voiceops` |
| `REDIS_URL` | `redis://redis:6379/0` |
| `OPENAI_API_KEY` | empty |
| `OPENAI_REALTIME_MODEL` | `gpt-realtime` |
| `OPENAI_REALTIME_VOICE` | `alloy` |
| `OPENAI_REALTIME_TURN_DETECTION` | `server_vad` |
| `OPENAI_REALTIME_INPUT_AUDIO_FORMAT` | `pcm16` |
| `OPENAI_REALTIME_OUTPUT_AUDIO_FORMAT` | `pcm16` |
| `MOCK_REALTIME` | `true` |
| `CORS_ORIGINS` | `http://localhost:5173` |
| `JWT_SECRET` | `change-me` |
| `PROMETHEUS_ENABLED` | `true` |

## REST API

- `POST /api/v1/sessions` creates a voice session.
- `GET /api/v1/sessions` lists sessions.
- `GET /api/v1/sessions/{session_id}` returns session metadata.
- `GET /api/v1/sessions/{session_id}/events` returns the event timeline.
- `GET /api/v1/sessions/{session_id}/metrics` returns latency metrics.
- `DELETE /api/v1/sessions/{session_id}` terminates a session.
- `GET /healthz` liveness.
- `GET /readyz` readiness.
- `GET /metrics` Prometheus metrics.

## WebSocket Protocol

Endpoint: `WS /ws/v1/sessions/{session_id}/audio`

Client messages include `client.session.start`, `client.audio.chunk`, `client.audio.stop`, `client.audio.mute`, `client.audio.unmute`, `client.response.interrupt`, `client.heartbeat`, and `client.session.close`.

Server messages include `server.session.started`, `server.session.state_changed`, `server.audio.received`, `server.transcript.delta`, `server.assistant.text_delta`, `server.assistant.audio_delta`, `server.response.interrupted`, `server.latency.update`, provider events, errors, and heartbeats.

## Audio Pipeline

The frontend captures microphone input with an `AudioWorkletProcessor`, computes RMS level, converts Float32 samples to PCM16, base64-encodes small frames, and sends typed `client.audio.chunk` messages over WebSocket. Assistant audio deltas are decoded and queued through a low-latency playback queue. On barge-in, playback stops immediately and `client.response.interrupt` is sent.

## Session State Machine

Allowed states: `created`, `connecting`, `provider_connecting`, `connected`, `listening`, `user_speaking`, `transcribing`, `assistant_thinking`, `assistant_speaking`, `interrupted`, `reconnecting`, `ending`, `ended`, `failed`.

Invalid transitions raise typed backend errors and are surfaced in the UI.

## Observability

Structured JSON logs include request IDs, session IDs, event types, providers, and latency values. Prometheus exposes active sessions, total sessions, failures, audio chunk counts, WebSocket connections, provider errors, barge-ins, duration histograms, and latency histograms. The `/sessions` and `/sessions/:id` pages provide operational views for traces, timelines, errors, and raw events.

## Troubleshooting

- Microphone meter does not move: use Chrome/Edge on `localhost`, grant permission, and check OS input settings.
- WebSocket fails: verify backend is reachable at `VITE_API_BASE_URL`.
- Provider unavailable: use `MOCK_REALTIME=true` or configure `OPENAI_API_KEY`.
- AudioWorklet fails: confirm the dev server serves `/src/worklets/recorder.worklet.ts` through Vite.
- Database readiness fails: wait for Postgres healthcheck or run `docker compose restart backend`.

## Production Readiness Checklist

- Replace `JWT_SECRET`.
- Use managed PostgreSQL and Redis.
- Enable TLS and authenticated WebSocket access.
- Configure CORS to known origins.
- Add persistent log shipping and trace exporters.
- Tune max audio chunk size, max session duration, and stale-session timeout.
- Add per-tenant rate limits and audit logging.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
