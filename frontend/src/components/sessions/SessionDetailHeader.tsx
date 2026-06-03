import { formatTime } from "../../lib/time";
import type { VoiceSession } from "../../lib/types";
import { StatusBadge, toneForStatus } from "../common/StatusBadge";

export function SessionDetailHeader({ session }: { session: VoiceSession }) {
  return (
    <section className="ops-card ops-gradient rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="section-title">Trace investigation</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Session {session.id.slice(0, 8)}</h1>
          <p className="mt-1 text-sm text-steel">{session.provider} / {session.transport} / {session.model ?? "no model"}</p>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-steel sm:items-end">
          <StatusBadge label={session.status} tone={toneForStatus(session.status)} pulse={!["ended", "failed"].includes(session.status)} />
          <div>Created: {formatTime(session.created_at)}</div>
        </div>
      </div>
    </section>
  );
}
