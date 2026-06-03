import { API_BASE_URL } from "./constants";
import type { LatencyMetric, SessionEvent, VoiceSession } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "content-type": "application/json" },
    ...init
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<T>;
}

export function createSession(): Promise<VoiceSession> {
  return request<VoiceSession>("/api/v1/sessions", { method: "POST" });
}

export function listSessions(): Promise<{
  summary: Record<string, number>;
  sessions: VoiceSession[];
}> {
  return request("/api/v1/sessions");
}

export function getSession(id: string): Promise<VoiceSession> {
  return request(`/api/v1/sessions/${id}`);
}

export function getSessionEvents(id: string): Promise<{ events: SessionEvent[] }> {
  return request(`/api/v1/sessions/${id}/events`);
}

export function getSessionMetrics(id: string): Promise<{ metrics: LatencyMetric[] }> {
  return request(`/api/v1/sessions/${id}/metrics`);
}

export function terminateSession(id: string): Promise<VoiceSession> {
  return request(`/api/v1/sessions/${id}`, { method: "DELETE" });
}
