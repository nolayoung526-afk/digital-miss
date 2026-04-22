'use client';

import { useClassroomStore } from '@/store/classroom';
import { AINSMode } from '@/lib/agora';
import clsx from 'clsx';

/** 底部栏 · 个性化入口 + AINS 切换 + 指标 */
export default function BottomBar() {
  const { ainsMode, setAins } = useClassroomStore();

  const modes: { key: AINSMode; label: string }[] = [
    { key: 'off', label: '关' },
    { key: 'balanced', label: '平衡' },
    { key: 'aggressive', label: '强' },
  ];

  return (
    <footer className="px-5 py-2 bg-slate-950/90 flex items-center justify-between text-xs">
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">
          🎁 今天为你的特别安排
        </button>
        <div className="flex items-center gap-2 text-slate-400">
          <span>🎚 降噪:</span>
          <div className="flex rounded-lg bg-slate-800 overflow-hidden">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setAins(m.key)}
                className={clsx(
                  'px-2 py-1 text-[10px]',
                  ainsMode === m.key && 'bg-slate-600'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-slate-400">
        <span>📊 本课互动 12/预计 14</span>
        <span>🎓 加法掌握 85%</span>
        <button className="hover:text-white">⚙</button>
      </div>
    </footer>
  );
}
