import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BarChart3, Gauge, Radio, Route, Settings, TerminalSquare } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { ConnectionBadge } from "../common/ConnectionBadge";
import { StatusBadge } from "../common/StatusBadge";
import { listSessions } from "../../lib/api";

const navItems = [
  { label: "Overview", path: "/", icon: Activity, activePaths: ["/"] },
  { label: "Sessions", path: "/sessions", icon: Radio, activePaths: ["/sessions"] },
  { label: "Traces", path: "/traces", icon: Route, activePaths: ["/traces"], activePrefix: "/sessions/" },
  { label: "Metrics", path: "/metrics", icon: BarChart3, activePaths: ["/metrics"] },
  { label: "Alerts", path: "/alerts", icon: AlertTriangle, activePaths: ["/alerts"] },
  { label: "Settings", path: "/settings", icon: Settings, activePaths: ["/settings"] }
];

export function AppShell() {
  const location = useLocation();
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listSessions()
      .then((data) => {
        if (!cancelled) setActiveSessions(Number(data.summary.active_sessions ?? 0));
      })
      .catch(() => {
        if (!cancelled) setActiveSessions(0);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/sessions/")) return "Trace investigation";
    if (location.pathname.startsWith("/sessions")) return "Operations overview";
    if (location.pathname.startsWith("/traces")) return "Trace explorer";
    if (location.pathname.startsWith("/metrics")) return "Metrics monitor";
    if (location.pathname.startsWith("/alerts")) return "Alert center";
    if (location.pathname.startsWith("/settings")) return "Gateway settings";
    return "Live voice console";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-base text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-[#080B10]/95 px-4 py-5 backdrop-blur xl:block">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-cyan/30 bg-cyan/10 text-sm font-bold text-cyan shadow-[0_0_32px_rgba(34,211,238,0.12)]">VG</span>
          <div>
            <div className="font-semibold tracking-tight text-ink">VoiceOps Gateway</div>
            <div className="text-xs text-steel">Realtime voice operations</div>
          </div>
        </Link>
        <div className="mt-6 rounded-lg border border-line bg-panel/80 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.18em] text-steel">System</span>
            <StatusBadge label="Live" tone="live" pulse />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border border-line bg-card p-2">
              <div className="text-steel">Active</div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-ink">{activeSessions}</div>
            </div>
            <div className="rounded border border-line bg-card p-2">
              <div className="text-steel">Mode</div>
              <div className="mt-1 font-semibold text-ok">Mock</div>
            </div>
          </div>
        </div>
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.activePaths?.includes(location.pathname) || (item.activePrefix && location.pathname.startsWith(item.activePrefix));
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                  active ? "border-cyan/30 bg-cyan/10 text-ink shadow-[inset_3px_0_0_#22D3EE,0_0_30px_rgba(34,211,238,0.08)]" : "border-transparent text-steel hover:border-line hover:bg-panel hover:text-ink"
                }`}
              >
                <Icon size={17} className={active ? "text-cyan" : "text-steel group-hover:text-cyan"} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="xl:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-[#080B10]/90 backdrop-blur">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <Link to="/" className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-xs font-bold text-cyan xl:hidden">VG</Link>
              <div>
                <div className="flex items-center gap-2 text-sm text-steel">
                  <TerminalSquare size={15} />
                  Operations Center
                </div>
                <h1 className="text-lg font-semibold tracking-tight text-ink">{pageTitle}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ConnectionBadge label="env" value={import.meta.env.MODE === "production" ? "production" : "local"} tone="ok" />
              <ConnectionBadge label="provider" value="Mock Realtime" tone="warn" />
              <ConnectionBadge label="active" value={`${activeSessions}`} tone={activeSessions ? "ok" : "neutral"} />
              <StatusBadge label="System nominal" tone="live" pulse={activeSessions > 0} />
              <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-cyan/10 text-cyan" : "text-steel hover:bg-panel hover:text-ink"}`} to="/">
                Console
              </NavLink>
              <NavLink className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-cyan/10 text-cyan" : "text-steel hover:bg-panel hover:text-ink"}`} to="/sessions">
                Sessions
              </NavLink>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1800px] px-4 py-5 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
