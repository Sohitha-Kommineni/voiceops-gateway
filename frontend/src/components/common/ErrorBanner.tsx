import { AlertTriangle } from "lucide-react";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad shadow-[0_0_28px_rgba(248,113,113,0.08)]">
      <AlertTriangle size={16} />
      {message}
    </div>
  );
}
