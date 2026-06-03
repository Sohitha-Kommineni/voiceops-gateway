import { useCallback, useRef, useState } from "react";

export function useBrowserSpeechRecognition() {
  const [supported] = useState(() => Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const desiredListeningRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  const start = useCallback(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) return;
    desiredListeningRef.current = true;
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += text;
        else interimText += text;
      }
      if (finalText) setTranscript((current) => `${current}${finalText.trim()} `.trimStart());
      setInterim(interimText);
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech") {
        setError(null);
        return;
      }
      setError(event.message || event.error || "Browser speech recognition stopped.");
    };
    recognition.onend = () => {
      setListening(false);
      if (desiredListeningRef.current) {
        restartTimerRef.current = window.setTimeout(() => start(), 300);
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "Speech recognition failed to start.");
    }
  }, []);

  const stop = useCallback(() => {
    desiredListeningRef.current = false;
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const reset = useCallback(() => {
    desiredListeningRef.current = false;
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    setTranscript("");
    setInterim("");
    setError(null);
  }, []);

  return {
    supported,
    listening,
    transcript: `${transcript}${interim ? ` ${interim}` : ""}`.trim(),
    error,
    start,
    stop,
    reset
  };
}
