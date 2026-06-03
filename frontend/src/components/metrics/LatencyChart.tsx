export function LatencyChart({
  title,
  values,
  color = "#22D3EE"
}: {
  title: string;
  values: number[];
  color?: string;
}) {
  const safeValues = values.length ? values.slice(-24) : [22, 38, 31, 64, 52, 83, 49, 71, 43, 58, 36, 47];
  const max = Math.max(...safeValues, 1);
  const points = safeValues
    .map((value, index) => {
      const x = (index / Math.max(1, safeValues.length - 1)) * 100;
      const y = 92 - (value / max) * 76;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <section className="ops-card rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">{title}</h2>
        <span className="text-xs text-steel">{values.length ? "live samples" : "frontend sample"}</span>
      </div>
      <svg className="mt-4 h-36 w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={title}>
        {[20, 40, 60, 80].map((line) => (
          <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="#232A36" strokeWidth="0.6" />
        ))}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={`0,100 ${points} 100,100`} fill={color} opacity="0.08" />
      </svg>
    </section>
  );
}
