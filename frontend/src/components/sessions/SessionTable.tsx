import { Link } from "react-router-dom";

import { durationSeconds, formatTime } from "../../lib/time";
import type { VoiceSession } from "../../lib/types";
import { StatusBadge, toneForStatus } from "../common/StatusBadge";

function metaNumber(session: VoiceSession, key: string): number {
  const value = session.metadata?.[key];
  return typeof value === "number" ? value : 0;
}

export function SessionTable({ sessions }: { sessions: VoiceSession[] }) {
  return (
    <div className="ops-card overflow-hidden rounded-lg">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="section-title">Session explorer</h2>
        <span className="text-xs text-steel">{sessions.length} recent sessions</span>
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line bg-panel/80 text-xs uppercase tracking-[0.16em] text-steel">
          <tr>
            {["Session ID", "Status", "Duration", "Provider", "Turns", "Errors", "Avg latency", "Last heartbeat", "Actions"].map((header) => (
              <th key={header} className="px-4 py-4 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b border-line bg-card/40 transition hover:bg-cyan/5">
              <td className="px-4 py-4">
                <div className="font-mono text-xs text-ink">{session.id.slice(0, 8)}</div>
                <div className="mt-1 text-xs text-steel">{formatTime(session.created_at)}</div>
              </td>
              <td className="px-4 py-4"><StatusBadge label={session.status} tone={toneForStatus(session.status)} pulse={!["ended", "failed", "created"].includes(session.status)} /></td>
              <td className="px-4 py-4 tabular-nums">{durationSeconds(session.started_at, session.ended_at)}</td>
              <td className="px-4 py-4">
                <div className="font-semibold text-ink">{session.provider}</div>
                <div className="text-xs text-steel">{session.transport}</div>
              </td>
              <td className="px-4 py-4 tabular-nums text-steel">
                <span className="text-ink">{metaNumber(session, "user_turns")}</span> user / <span className="text-ink">{metaNumber(session, "assistant_turns")}</span> assistant
              </td>
              <td className="px-4 py-4 tabular-nums">{metaNumber(session, "error_count")}</td>
              <td className="px-4 py-4 tabular-nums">{metaNumber(session, "average_latency_ms")}ms</td>
              <td className="px-4 py-4 text-steel">{formatTime(session.last_heartbeat_at)}</td>
              <td className="px-4 py-4">
                <Link className="rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs font-semibold text-cyan shadow-sm transition hover:bg-cyan/15" to={`/sessions/${session.id}`}>Investigate</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
