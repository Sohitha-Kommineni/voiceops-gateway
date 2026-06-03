export function AudioLevelMeter({ level }: { level: number }) {
  const width = `${Math.min(100, Math.round(level * 500))}%`;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-steel">
        <span>Audio input level</span>
        <span>{Math.round(level * 1000)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-line bg-panel">
        <div className="h-full rounded-full bg-gradient-to-r from-teal via-cyan to-blue transition-[width]" style={{ width }} />
      </div>
    </div>
  );
}
