'use client';

import { useEditorStore, Variant } from '@/store/editor';
import clsx from 'clsx';

const TONE_MAP: Record<Variant['tag'], string> = {
  default: 'bg-slate-50 border-slate-200 text-slate-700',
  confused: 'bg-amber-50 border-amber-300 text-amber-900 [&_.rule]:bg-amber-500',
  high: 'bg-emerald-50 border-emerald-300 text-emerald-900 [&_.rule]:bg-emerald-500',
  asr: 'bg-sky-50 border-sky-300 text-sky-900 [&_.rule]:bg-sky-500',
};

const TONE_ICON: Record<Variant['tag'], string> = {
  default: '📄',
  confused: '🔵',
  high: '🚀',
  asr: '🎧',
};

export default function VariantPanel() {
  const { variants } = useEditorStore();

  return (
    <aside className="col-span-4 space-y-3 overflow-y-auto">
      {/* Variant 管理 */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">🪄 学员画像变体 ({variants.length})</h3>
          <button className="text-xs text-indigo-600">+ 添加变体</button>
        </div>
        <div className="space-y-2.5">
          {variants.map((v) => (
            <div
              key={v.id}
              className={clsx('p-3 rounded-xl border', TONE_MAP[v.tag])}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold">
                  {TONE_ICON[v.tag]} {v.name}
                </div>
                {v.ruleMatched && (
                  <span className="rule text-[10px] px-1.5 py-0.5 rounded text-white font-mono">
                    {v.ruleMatched}
                  </span>
                )}
              </div>
              <div className="text-xs mt-1.5">{v.ttsText}</div>
              <div className="text-[10px] mt-1 opacity-75">When: {v.when}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 奖励策略 */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="text-sm font-semibold mb-3">🎁 奖励策略(K5 / K9)</h3>
        <div className="space-y-2 text-xs">
          <RewardRow label="单题答对" value="仅口头鼓励(避免疲劳)" />
          <RewardRow label="连续 3 题正确" value="触发 T_AWARD_ALL_STAR ⭐" tone="emerald" />
          <RewardRow label="章节结束" value="红包雨 🧧" tone="red" />
          <RewardRow label="低参与学员" value="K9 权重覆盖 · 红包 0.5" tone="amber" />
        </div>
      </div>

      {/* AI 预审提示 */}
      <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">🤖</span>
          <h3 className="text-sm font-semibold text-indigo-900">AI 预审建议</h3>
        </div>
        <ul className="text-xs text-indigo-800 space-y-1.5">
          <li className="flex gap-2"><span>✅</span>话术语气符合豆豆 IP 人设</li>
          <li className="flex gap-2"><span>✅</span>板书指令与话术时序对齐</li>
          <li className="flex gap-2"><span>⚠️</span>建议补 1 条"答错后第二次提示"分支</li>
          <li className="flex gap-2"><span>💡</span>检测到 sc_13 奖励话术可复用</li>
        </ul>
      </div>
    </aside>
  );
}

function RewardRow({
  label, value, tone,
}: { label: string; value: string; tone?: 'emerald' | 'red' | 'amber' }) {
  const toneMap = {
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'bg-amber-50 border border-amber-200 text-amber-800 [&_.label]:text-amber-700',
  };
  const outer = tone === 'amber' ? toneMap.amber : '';
  const valTone = tone && tone !== 'amber' ? toneMap[tone] : 'text-slate-700';
  return (
    <div className={clsx('flex items-center justify-between p-2 rounded-lg bg-slate-50', outer)}>
      <span className={clsx('label', tone !== 'amber' && 'text-slate-600')}>{label}</span>
      <span className={clsx('font-semibold', valTone)}>{value}</span>
    </div>
  );
}
