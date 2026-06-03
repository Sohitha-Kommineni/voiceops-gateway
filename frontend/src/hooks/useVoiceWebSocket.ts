import { useCallback, useEffect, useRef, useState } from "react";

import { WS_BASE_URL } from "../lib/constants";
import { encodeClientMessage, parseServerMessage } from "../lib/ws";
import type { ClientMessage, ServerMessage } from "../lib/types";

export type TransportStatus = "idle" | "connecting" | "open" | "closed" | "error";

export function useVoiceWebSocket(sessionId: string | null, onMessage: (message: ServerMessage) => void) {
  const [status, setStatus] = useState<TransportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(encodeClientMessage(message));
      return true;
    }
    return false;
  }, []);

  const connect = useCallback(() => {
    if (!sessionId) return;
    setStatus("connecting");
    const ws = new WebSocket(`${WS_BASE_URL}/ws/v1/sessions/${sessionId}/audio`);
    wsRef.current = ws;
    ws.onopen = () => {
      setStatus("open");
      send({ type: "client.session.start", session_id: sessionId, timestamp: Date.now() });
    };
    ws.onmessage = (event) => {
      try {
        onMessage(parseServerMessage(event.data));
      } catch (exc) {
        setError(exc instanceof Error ? exc.message : "Invalid WebSocket message.");
      }
    };
    ws.onerror = () => {
      setStatus("error");
      setError("WebSocket connection failed.");
    };
    ws.onclose = () => setStatus("closed");
  }, [onMessage, send, sessionId]);

  const close = useCallback(() => {
    if (sessionId) send({ type: "client.session.close", session_id: sessionId, timestamp: Date.now() });
    wsRef.current?.close();
  }, [send, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const heartbeat = window.setInterval(() => {
      send({ type: "client.heartbeat", session_id: sessionId, timestamp: Date.now() });
    }, 15000);
    return () => window.clearInterval(heartbeat);
  }, [send, sessionId]);

  return { status, error, connect, close, send };
}
