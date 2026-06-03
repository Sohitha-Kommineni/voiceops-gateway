import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createSession, terminateSession } from "../lib/api";
import { BARGE_IN_THRESHOLD } from "../lib/constants";
import type { AudioChunk, ServerMessage, SessionState, VoiceSession } from "../lib/types";
import { errorMessage } from "../lib/errors";
import { useAudioPlaybackQueue } from "./useAudioPlaybackQueue";
import { useAudioWorkletCapture } from "./useAudioWorkletCapture";
import { useMicrophonePermission } from "./useMicrophonePermission";
import { useSessionEvents } from "./useSessionEvents";
import { useVoiceWebSocket } from "./useVoiceWebSocket";
import { useBrowserSpeechRecognition } from "./useBrowserSpeechRecognition";

function appendStreamText(current: string, text: string, isFinal: boolean): string {
  if (!text) return current;
  if (!isFinal) return `${current}${text}`;
  const trimmedCurrent = current.trimEnd();
  const trimmedText = text.trim();
  if (trimmedCurrent && trimmedText.startsWith(trimmedCurrent)) return `${trimmedText}\n`;
  return `${current}${text}\n`;
}

export function useVoiceSession() {
  const mic = useMicrophonePermission();
  const timeline = useSessionEvents();
  const playback = useAudioPlaybackQueue();
  const speech = useBrowserSpeechRecognition();
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>("created");
  const [level, setLevel] = useState(0);
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [providerConnected, setProviderConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const speakingRef = useRef(false);

  const handleServerMessage = useCallback(
    (message: ServerMessage) => {
      timeline.push(message);
      if (message.type === "server.session.started" || message.type === "server.session.state_changed") {
        const state = String(message.payload.state ?? message.payload.status ?? sessionState) as SessionState;
        setSessionState(state);
      }
      if (message.type === "server.provider.connected") setProviderConnected(true);
      if (message.type === "server.provider.disconnected") setProviderConnected(false);
      if (message.type === "server.transcript.delta" || message.type === "server.transcript.final") {
        setUserTranscript((current) => appendStreamText(current, String(message.payload.text ?? ""), message.type.endsWith("final")));
      }
      if (message.type === "server.assistant.text_delta" || message.type === "server.assistant.text_final") {
        setAssistantTranscript((current) => appendStreamText(current, String(message.payload.text ?? ""), message.type.endsWith("final")));
      }
      if (message.type === "server.assistant.audio_delta") {
        const audio = String(message.payload.audio ?? "");
        if (audio) playback.enqueue(audio, Number(message.payload.sample_rate ?? 24000));
      }
      if (message.type === "server.response.interrupted") playback.stopImmediately();
      if (message.type.includes("error")) setError(String(message.payload.message ?? "Session error."));
    },
    [playback, sessionState, timeline]
  );

  const ws = useVoiceWebSocket(session?.id ?? null, handleServerMessage);

  useEffect(() => {
    speakingRef.current = playback.speaking;
  }, [playback.speaking]);

  const sendAudioChunk = useCallback(
    (chunk: AudioChunk) => {
      ws.send({
        type: "client.audio.chunk",
        session_id: chunk.session_id,
        sequence_number: chunk.sequence_number,
        timestamp: chunk.timestamp,
        audio: chunk
      });
    },
    [ws]
  );

  const capture = useAudioWorkletCapture({
    sessionId: session?.id ?? "",
    onAudioChunk: sendAudioChunk,
    onLevel: (value) => {
      setLevel(value);
      if (speakingRef.current && value > BARGE_IN_THRESHOLD && session) {
        playback.stopImmediately();
        ws.send({ type: "client.response.interrupt", session_id: session.id, timestamp: Date.now() });
      }
    },
    streamFactory: mic.request
  });

  const startSession = useCallback(async () => {
    try {
      setError(null);
      const created = await createSession();
      setSession(created);
      setSessionState(created.status);
      setUserTranscript("");
      setAssistantTranscript("");
      speech.reset();
    } catch (exc) {
      setError(errorMessage(exc));
    }
  }, [speech]);

  useEffect(() => {
    if (session?.id && ws.status === "idle") ws.connect();
  }, [session?.id, ws]);

  const startCapture = useCallback(async () => {
    if (!session) return;
    speech.start();
    await capture.start();
  }, [capture, session, speech]);

  const stopSession = useCallback(async () => {
    if (session) {
      ws.send({ type: "client.audio.stop", session_id: session.id, timestamp: Date.now() });
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
    }
    setSessionState("ending");
    capture.stop();
    speech.stop();
    ws.close();
    playback.stopImmediately();
    if (session) {
      try {
        await terminateSession(session.id);
        setSessionState("ended");
      } catch (exc) {
        setError(errorMessage(exc));
      }
    }
  }, [capture, playback, session, speech, ws]);

  const interrupt = useCallback(() => {
    if (!session) return;
    playback.stopImmediately();
    ws.send({ type: "client.response.interrupt", session_id: session.id, timestamp: Date.now() });
  }, [playback, session, ws]);

  const providerLabel = useMemo(() => session?.provider ?? "Unknown", [session]);

  return {
    session,
    sessionState,
    providerLabel,
    providerConnected,
    mic,
    ws,
    capture,
    playback,
    level,
    userTranscript,
    localSpeechTranscript: speech.transcript,
    localSpeechSupported: speech.supported,
    localSpeechListening: speech.listening,
    localSpeechError: speech.error,
    assistantTranscript,
    timeline,
    error: error ?? ws.error ?? capture.error ?? playback.error,
    startSession,
    startCapture,
    stopSession,
    interrupt
  };
}
