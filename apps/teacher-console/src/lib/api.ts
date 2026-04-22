/** 与后端对接 · 占位实现 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const env = await res.json();
  return (env.data ?? env) as T;
}

export async function saveScript(scriptId: string, payload: object) {
  return fetchJson(`/v1/script/${scriptId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function submitReview(scriptId: string) {
  return fetchJson(`/v1/script/${scriptId}/submit`, { method: 'POST' });
}

export async function aiPreReview(scriptId: string) {
  return fetchJson(`/v1/script/${scriptId}/ai-review`, { method: 'POST' });
}
