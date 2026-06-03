export function formatTime(value?: string | null): string {
  if (!value) return "none";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

export function durationSeconds(start?: string | null, end?: string | null): string {
  if (!start) return "0s";
  const stop = end ? new Date(end).getTime() : Date.now();
  return `${Math.max(0, Math.round((stop - new Date(start).getTime()) / 1000))}s`;
}
