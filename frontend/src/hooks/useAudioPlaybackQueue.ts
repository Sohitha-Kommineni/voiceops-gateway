import { useCallback, useRef, useState } from "react";

import { createAudioBufferFromPcm16 } from "../lib/audio";

interface PlaybackItem {
  audio: string;
  sampleRate: number;
}

export function useAudioPlaybackQueue() {
  const [speaking, setSpeaking] = useState(false);
  const [queued, setQueued] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const queueRef = useRef<PlaybackItem[]>([]);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playingRef = useRef(false);

  const ensureContext = useCallback(() => {
    contextRef.current ??= new AudioContext({ sampleRate: 24000 });
    return contextRef.current;
  }, []);

  const pump = useCallback(() => {
    if (playingRef.current) return;
    const next = queueRef.current.shift();
    setQueued(queueRef.current.length);
    if (!next) {
      setSpeaking(false);
      return;
    }
    try {
      const context = ensureContext();
      const source = context.createBufferSource();
      source.buffer = createAudioBufferFromPcm16(context, next.audio, next.sampleRate);
      source.connect(context.destination);
      source.onended = () => {
        playingRef.current = false;
        activeSourceRef.current = null;
        pump();
      };
      playingRef.current = true;
      activeSourceRef.current = source;
      setSpeaking(true);
      source.start();
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Playback failure.");
      playingRef.current = false;
      setSpeaking(false);
    }
  }, [ensureContext]);

  const enqueue = useCallback(
    (audio: string, sampleRate = 24000) => {
      queueRef.current.push({ audio, sampleRate });
      setQueued(queueRef.current.length);
      pump();
    },
    [pump]
  );

  const stopImmediately = useCallback(() => {
    queueRef.current = [];
    setQueued(0);
    activeSourceRef.current?.stop();
    activeSourceRef.current = null;
    playingRef.current = false;
    setSpeaking(false);
  }, []);

  return { speaking, queued, error, enqueue, stopImmediately };
}
