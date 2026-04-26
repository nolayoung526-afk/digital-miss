/**
 * Persona / Asset API 封装 · 调 teacher-asset-mgr
 * Next.js rewrites 已把 /api/v1/persona/* 和 /api/v1/asset/* 代理到 8082
 */

export interface UploadAssetResult {
  url: string;
  size: number;
  sha256: string;
  kind: string;
  personaKey: string;
}

export async function uploadAsset(
  file: File,
  kind: 'photo' | 'voice' | 'license',
  personaKey: string,
): Promise<UploadAssetResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  form.append('personaKey', personaKey);

  const res = await fetch('/api/v1/asset/upload', { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`upload ${kind} failed · HTTP ${res.status} ${text}`);
  }
  return res.json();
}

export interface ClonePersonaPayload {
  realTeacherId: string;
  displayName: string;
  photoOssUrl: string;
  voiceSampleOssUrl: string;
  licenseDocUrl: string;
  licenseValidUntil: string;
}

export interface ClonePersonaResult {
  personaId: string;
  status: string;
  renderVendor: string;
  vendorAvatarId: string;
  ttsVendor: string;
  vendorVoiceId: string;
  displayName: string;
  realTeacherId: string;
  licenseValidUntil: string;
}

export async function clonePersona(body: ClonePersonaPayload): Promise<ClonePersonaResult> {
  const res = await fetch('/api/v1/persona/clone', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`clone failed · HTTP ${res.status} ${text}`);
  }
  return res.json();
}
