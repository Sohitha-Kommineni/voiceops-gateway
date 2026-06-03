import { useCallback, useRef, useState } from "react";

import { AUDIO_SAMPLE_RATE } from "../lib/constants";
import { floatToPcm16, pcm16ToBase64 } from "../lib/audioCodecs";
import type { AudioChunk } from "../lib/types";

interface CaptureOptions {
  sessionId: string;
  onAudioChunk: (chunk: AudioChunk) => void;
  onLevel: (level: number) => void;
  streamFactory: () => Promise<MediaStream | null>;
}

export function useAudioWorkletCapture({ sessionId, onAudioChunk, onLevel, streamFactory }: CaptureOptions) {
  const [capturing, setCapturing] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const stop = useCallback(() => {
    nodeRef.current?.disconnect();
    sourceRef.current?.disconnect();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    contextRef.current?.close();
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    contextRef.current = null;
    setCapturing(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const stream = await streamFactory();
    if (!stream) {
      setError("Microphone permission denied or unavailable.");
      return;
    }
    try {
      const context = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });
      await context.audioWorklet.addModule(new URL("../worklets/recorder.worklet.ts", import.meta.url));
      const source = context.createMediaStreamSource(stream);
      const node = new AudioWorkletNode(context, "voiceops-recorder");
      node.port.onmessage = (event: MessageEvent) => {
        if (event.data?.type === "level") onLevel(event.data.level);
        if (event.data?.type === "audio") {
          const samples = event.data.samples as Float32Array;
          const pcm16 = floatToPcm16(samples);
          onAudioChunk({
            session_id: sessionId,
            sequence_number: event.data.sequence,
            timestamp: Date.now(),
            sample_rate: context.sampleRate,
            encoding: "pcm16",
            payload: pcm16ToBase64(pcm16)
          });
        }
      };
      source.connect(node);
      node.connect(context.destination);
      streamRef.current = stream;
      contextRef.current = context;
      sourceRef.current = source;
      nodeRef.current = node;
      setCapturing(true);
    } catch (exc) {
      stop();
      setError(exc instanceof Error ? exc.message : "AudioWorklet initialization failed.");
    }
  }, [onAudioChunk, onLevel, sessionId, stop, streamFactory]);

  const setMute = useCallback((value: boolean) => {
    setMuted(value);
    nodeRef.current?.port.postMessage({ type: "mute", value });
  }, []);

  const suspend = useCallback(() => contextRef.current?.suspend(), []);
  const resume = useCallback(() => contextRef.current?.resume(), []);

  return { capturing, muted, error, start, stop, setMute, suspend, resume };
}
