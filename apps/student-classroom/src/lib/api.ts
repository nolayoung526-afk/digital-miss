/** class-orchestrator 后端调用封装 */

export interface CreateClassResponse {
  classId: string;
  status: string;
  warmingAt: string;
  rtcRoom: { roomId: string; tokenTtlSec: number };
}

const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? '/api';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const envelope = await res.json();
  return (envelope.data ?? envelope) as T;
}

export async function createClass(payload: {
  courseId: string;
  scriptId: string;
  teacherId: string;
  assistantId: string;
  studentIds: string[];
  startAt: string;
  durationMin?: number;
}): Promise<CreateClassResponse> {
  return fetchJson('/v1/live-class/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getClass(classId: string) {
  return fetchJson(`/v1/live-class/${classId}`);
}

/** 学员端请求 Agora Token(通常由 class-orchestrator 签发) */
export interface TokenResponse {
  appId: string;
  token: string;
  channel: string;
  uid: string;
  ttlSec: number;
}

export async function requestJoinToken(classId: string, studentId: string): Promise<TokenResponse> {
  return fetchJson(`/v1/live-class/${classId}/join-token?studentId=${studentId}`, {
    method: 'POST',
  });
}
