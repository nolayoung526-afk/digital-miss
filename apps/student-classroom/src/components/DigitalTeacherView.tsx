'use client';

import { useClassroomStore } from '@/store/classroom';

const STATE_COLORS = {
  idle: 'bg-slate-600',
  speaking: 'bg-emerald-500',
  listening: 'bg-amber-500',
  responding: 'bg-sky-500',
  paused: 'bg-red-500',
} as const;

const STATE_EMOJI = {
  idle: '😌',
  speaking: '👩‍🏫',
  listening: '🤔',
  responding: '😊',
  paused: '😯',
};

/** 数字人主画面(含字幕 + 课件浮层 + AI 标识) */
export default function DigitalTeacherView() {
  const { dtState, subtitle } = useClassroomStore();

  return (
    <div className="flex-1 rounded-2xl overflow-hidden relative bg-gradient-to-br from-indigo-900 via-purple-900 to-rose-900 shadow-xl">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-[160px] transition-all duration-200">
          {STATE_EMOJI[dtState]}
        </div>
      </div>

      {/* 课件浮层 */}
      <div className="absolute top-4 left-4 w-56 h-32 bg-white/95 text-slate-900 rounded-2xl p-3 shadow-xl">
        <div className="text-[10px] text-slate-500 font-semibold">📑 课件</div>
        <div className="mt-1 text-center text-xl">🍎 3 + 🍎🍎🍎🍎🍎 = ?</div>
        <div className="mt-2 text-[10px] text-center text-slate-400">第 3 题 / 共 8 题</div>
      </div>

      {/* AI 标识 · 每帧必须可见(合规) */}
      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-[10px] flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${STATE_COLORS[dtState]} animate-pulse`} />
        <span>AI 数字人 · 原型:王老师</span>
      </div>

      {/* 字幕 */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <div className="px-5 py-2.5 rounded-2xl bg-black/65 backdrop-blur text-center max-w-[70%]">
          <div className="text-base">{subtitle || '...'}</div>
        </div>
      </div>

      {/* 状态徽章 */}
      <div className={`absolute top-4 left-64 px-3 py-1 rounded-full text-xs font-semibold ${STATE_COLORS[dtState]}`}>
        {dtState}
      </div>
    </div>
  );
}
