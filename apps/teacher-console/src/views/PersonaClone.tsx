'use client';

import { useState } from 'react';
import { uploadAsset, clonePersona, type ClonePersonaResult } from '@/lib/persona-api';

type UploadState = 'idle' | 'uploading' | 'done' | 'error';

interface VoiceSlot {
  idx: number;
  file: File | null;
  url: string | null;
  state: UploadState;
  error?: string;
}

const RECORDING_SCRIPT: string[] = [
  '小朋友们大家好,我是豆豆老师,今天我们一起来学加法。',
  '你看,这里有三个红苹果,再加上五个青苹果,一共是几个呢?',
  '三加五等于八,真棒!你已经学会了。',
  '让我们再来看一道题,小明有十块钱,买了两支铅笔,还剩多少钱?',
  '这是一道很有意思的题目,我们来一起想一想。',
  '哎呀,这道题有点难,但是没关系,慢慢来,老师陪着你。',
  '一、二、三、四、五、六、七、八、九、十,我们一起数。',
  '太厉害啦!你已经超过百分之九十的同学了!',
  '现在请大家拿出小手指,我们一起来数一数。',
  '加油加油!坚持就是胜利,豆豆老师相信你能做到。',
];

export default function PersonaClone() {
  const [realTeacherId, setRealTeacherId] = useState('T-001');
  const [displayName, setDisplayName] = useState('豆豆老师');
  const [personaKey, setPersonaKey] = useState('persona_001_doudou');
  const [licenseValidUntil, setLicenseValidUntil] = useState('2027-12-31');

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoState, setPhotoState] = useState<UploadState>('idle');
  const [photoError, setPhotoError] = useState<string>('');

  const [voiceSlots, setVoiceSlots] = useState<VoiceSlot[]>(
    Array.from({ length: 10 }, (_, i) => ({ idx: i + 1, file: null, url: null, state: 'idle' })),
  );

  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseUrl, setLicenseUrl] = useState<string | null>(null);
  const [licenseState, setLicenseState] = useState<UploadState>('idle');

  const [cloneResult, setCloneResult] = useState<ClonePersonaResult | null>(null);
  const [cloneState, setCloneState] = useState<UploadState>('idle');
  const [cloneError, setCloneError] = useState<string>('');

  const photoReady = photoState === 'done' && photoUrl;
  const voiceReady = voiceSlots.every((s) => s.state === 'done' && s.url);
  const licenseReady = licenseState === 'done' && licenseUrl;
  const canClone = photoReady && voiceReady && licenseReady && personaKey && displayName;

  // --- handlers ---
  const handlePhotoChange = async (f: File | null) => {
    if (!f) return;
    setPhotoFile(f);
    setPhotoState('uploading');
    setPhotoError('');
    try {
      const res = await uploadAsset(f, 'photo', personaKey);
      setPhotoUrl(res.url);
      setPhotoState('done');
    } catch (e) {
      setPhotoState('error');
      setPhotoError((e as Error).message);
    }
  };

  const handleVoiceChange = async (slotIdx: number, f: File | null) => {
    if (!f) return;
    setVoiceSlots((prev) =>
      prev.map((s) => (s.idx === slotIdx ? { ...s, file: f, state: 'uploading', error: undefined } : s)),
    );
    try {
      // 重命名成 01.wav / 02.wav · 保留扩展名
      const ext = f.name.split('.').pop() || 'wav';
      const renamed = new File([f], `${String(slotIdx).padStart(2, '0')}.${ext}`, { type: f.type });
      const res = await uploadAsset(renamed, 'voice', personaKey);
      setVoiceSlots((prev) =>
        prev.map((s) => (s.idx === slotIdx ? { ...s, url: res.url, state: 'done' } : s)),
      );
    } catch (e) {
      setVoiceSlots((prev) =>
        prev.map((s) =>
          s.idx === slotIdx ? { ...s, state: 'error', error: (e as Error).message } : s,
        ),
      );
    }
  };

  const handleLicenseChange = async (f: File | null) => {
    if (!f) return;
    setLicenseFile(f);
    setLicenseState('uploading');
    try {
      const res = await uploadAsset(f, 'license', personaKey);
      setLicenseUrl(res.url);
      setLicenseState('done');
    } catch (e) {
      setLicenseState('error');
      console.error(e);
    }
  };

  const handleClone = async () => {
    if (!canClone || !photoUrl || !licenseUrl) return;
    setCloneState('uploading');
    setCloneError('');
    try {
      const result = await clonePersona({
        realTeacherId,
        displayName,
        photoOssUrl: photoUrl,
        // MVP · 10 句音频只取第一句路径传给后端(adapter mock 不处理批)
        // Sprint 2 中期:后端增加 voiceSamples 字段接收全部 10 句
        voiceSampleOssUrl: voiceSlots[0].url!,
        licenseDocUrl: licenseUrl,
        licenseValidUntil,
      });
      setCloneResult(result);
      setCloneState('done');
    } catch (e) {
      setCloneState('error');
      setCloneError((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold">
            P
          </div>
          <div>
            <div className="text-sm font-semibold">Persona 克隆工作台</div>
            <div className="text-xs text-slate-500">
              上传照片 + 10 句音频 + 授权书 · 一键创建数字人 Persona
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 基本信息 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">📋 基本信息</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="真人老师 ID" value={realTeacherId} onChange={setRealTeacherId} />
            <Field label="显示名称" value={displayName} onChange={setDisplayName} />
            <Field
              label="Persona Key(素材目录名)"
              value={personaKey}
              onChange={setPersonaKey}
              hint="仅字母数字 _ - · 建议 persona_001_xxx"
            />
            <Field
              label="授权有效期"
              value={licenseValidUntil}
              onChange={setLicenseValidUntil}
              hint="YYYY-MM-DD"
            />
          </div>
        </section>

        {/* 照片 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">📸 肖像照</h2>
          <p className="text-xs text-slate-500 mb-3">
            ≥1024×1024 · jpg/png · 正面 · 白背景 · 中性微笑
          </p>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
              {photoFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-slate-400">📷</span>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                className="block text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer"
              />
              <StatusLine state={photoState} url={photoUrl} error={photoError} />
            </div>
          </div>
        </section>

        {/* 10 句音频 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">🎙 10 句音频样本</h2>
          <p className="text-xs text-slate-500 mb-4">
            wav/mp3 · 单声道 · 24kHz · 每句 5-10s · 按编号一句一录
          </p>
          <div className="space-y-2">
            {voiceSlots.map((s) => (
              <div
                key={s.idx}
                className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {String(s.idx).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-600 mb-1.5 leading-relaxed">
                    {RECORDING_SCRIPT[s.idx - 1]}
                  </div>
                  <input
                    type="file"
                    accept="audio/wav,audio/mpeg,audio/mp3,audio/m4a,audio/x-m4a"
                    onChange={(e) => handleVoiceChange(s.idx, e.target.files?.[0] ?? null)}
                    className="block text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-200 hover:file:bg-slate-300"
                  />
                  <StatusLine state={s.state} url={s.url} error={s.error} compact />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 授权书 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">📄 授权书</h2>
          <p className="text-xs text-slate-500 mb-3">
            pdf/jpg/png · 含肖像权 + 声音权 + 第三方再许可 3 合 1
          </p>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => handleLicenseChange(e.target.files?.[0] ?? null)}
            className="block text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 file:cursor-pointer"
          />
          <StatusLine state={licenseState} url={licenseUrl} />
        </section>

        {/* 创建 Persona */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 mb-1">✨ 创建 Persona</h2>
              <p className="text-xs text-slate-500">
                {canClone
                  ? '全部素材就绪 · 点击创建 → 调厂商 API(Mock)· 落库 reviewing'
                  : '请先上传照片 + 10 句音频 + 授权书'}
              </p>
            </div>
            <button
              disabled={!canClone || cloneState === 'uploading'}
              onClick={handleClone}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cloneState === 'uploading' ? '创建中...' : '创建 Persona →'}
            </button>
          </div>
          {cloneError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
              ❌ {cloneError}
            </div>
          )}
          {cloneResult && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
              <div className="font-semibold text-emerald-900 mb-2">✅ 创建成功</div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-emerald-900">
                <div>
                  <dt className="opacity-60">persona_id</dt>
                  <dd className="font-mono">{cloneResult.personaId}</dd>
                </div>
                <div>
                  <dt className="opacity-60">status</dt>
                  <dd className="font-mono">{cloneResult.status}</dd>
                </div>
                <div>
                  <dt className="opacity-60">render_vendor</dt>
                  <dd className="font-mono">{cloneResult.renderVendor}</dd>
                </div>
                <div>
                  <dt className="opacity-60">tts_vendor</dt>
                  <dd className="font-mono">{cloneResult.ttsVendor}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="opacity-60">vendor_avatar_id</dt>
                  <dd className="font-mono">{cloneResult.vendorAvatarId}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="opacity-60">vendor_voice_id</dt>
                  <dd className="font-mono">{cloneResult.vendorVoiceId}</dd>
                </div>
              </dl>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-indigo-500"
      />
      {hint && <div className="text-[10px] text-slate-400 mt-1">{hint}</div>}
    </label>
  );
}

function StatusLine({
  state,
  url,
  error,
  compact,
}: {
  state: UploadState;
  url?: string | null;
  error?: string;
  compact?: boolean;
}) {
  if (state === 'idle') return null;
  const base = compact ? 'text-[10px] mt-1' : 'text-xs mt-2';
  if (state === 'uploading') return <div className={`${base} text-slate-500`}>⏳ 上传中...</div>;
  if (state === 'done')
    return (
      <div className={`${base} text-emerald-600 font-mono truncate`} title={url ?? ''}>
        ✅ {url}
      </div>
    );
  return <div className={`${base} text-red-600`}>❌ {error || '上传失败'}</div>;
}
