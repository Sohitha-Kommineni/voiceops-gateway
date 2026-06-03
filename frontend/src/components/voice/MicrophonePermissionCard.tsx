import { Mic } from "lucide-react";

export function MicrophonePermissionCard({
  status,
  onRequest
}: {
  status: string;
  onRequest: () => Promise<MediaStream | null>;
}) {
  return (
    <section className="ops-card rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mic size={18} className="text-cyan" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Microphone</h2>
            <p className="text-xs text-steel">Permission state: {status}</p>
          </div>
        </div>
        <button className="focus-ring rounded border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm font-semibold text-cyan hover:bg-cyan/15" onClick={onRequest}>
          Grant
        </button>
      </div>
    </section>
  );
}
