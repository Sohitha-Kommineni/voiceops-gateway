import type { ServerMessage } from "../../lib/types";

export function RawEventDrawer({ open, events, onClose }: { open: boolean; events: ServerMessage[]; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <aside className="ml-auto h-full w-full max-w-2xl overflow-auto border-l border-line bg-card p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Raw event inspector</h2>
          <button className="rounded-lg border border-line bg-panel px-3 py-1 text-sm text-ink hover:border-cyan/30 hover:bg-cyan/10" onClick={onClose}>Close</button>
        </div>
        <pre className="scroll-dark whitespace-pre-wrap rounded-lg border border-line bg-panel p-3 text-xs text-steel">{JSON.stringify(events, null, 2)}</pre>
      </aside>
    </div>
  );
}
