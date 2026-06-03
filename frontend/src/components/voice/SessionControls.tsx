import { Mic, MicOff, Octagon, PhoneCall, Square, Zap } from "lucide-react";

export function SessionControls({
  canCapture,
  capturing,
  muted,
  onStartSession,
  onStartCapture,
  onStop,
  onMute,
  onInterrupt
}: {
  canCapture: boolean;
  capturing: boolean;
  muted: boolean;
  onStartSession: () => void;
  onStartCapture: () => void;
  onStop: () => void;
  onMute: (value: boolean) => void;
  onInterrupt: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/15 px-3 py-2 text-sm font-semibold text-ok hover:bg-ok/20" onClick={onStartSession}>
        <PhoneCall size={16} />
        Start Session
      </button>
      <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink hover:border-cyan/30 hover:bg-cyan/10" disabled={!canCapture || capturing} onClick={onStartCapture}>
        <Mic size={16} />
        Capture Mic
      </button>
      <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink hover:border-cyan/30 hover:bg-cyan/10" disabled={!capturing} onClick={() => onMute(!muted)}>
        {muted ? <MicOff size={16} /> : <Mic size={16} />}
        {muted ? "Unmute" : "Mute"}
      </button>
      <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn hover:bg-warn/15" onClick={onInterrupt}>
        <Zap size={16} />
        Interrupt
      </button>
      <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad hover:bg-bad/15" onClick={onStop}>
        <Square size={16} />
        Stop
      </button>
    </div>
  );
}
