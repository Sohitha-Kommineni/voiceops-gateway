import { useCallback, useEffect, useState } from "react";

type MicPermission = "unsupported" | "unknown" | "prompt" | "granted" | "denied";

export function useMicrophonePermission() {
  const [status, setStatus] = useState<MicPermission>("unknown");
  const supported =
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    ("AudioContext" in window || "webkitAudioContext" in window);

  useEffect(() => {
    if (!supported) {
      setStatus("unsupported");
      return;
    }
    navigator.permissions
      ?.query({ name: "microphone" as PermissionName })
      .then((permission) => {
        setStatus(permission.state as MicPermission);
        permission.onchange = () => setStatus(permission.state as MicPermission);
      })
      .catch(() => setStatus("prompt"));
  }, [supported]);

  const request = useCallback(async () => {
    if (!supported) {
      setStatus("unsupported");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setStatus("granted");
      return stream;
    } catch {
      setStatus("denied");
      return null;
    }
  }, [supported]);

  return { status, supported, request };
}
