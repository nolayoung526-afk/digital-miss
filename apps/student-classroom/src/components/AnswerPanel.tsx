'use client';

import { useEffect, useState } from 'react';
import { useClassroomStore } from '@/store/classroom';

interface AnswerPanelProps {
  onAnswer?: (value: string) => void;
}

/** 答题区 · 倒计时 + 4 选项 + 举手/击掌 */
export default function AnswerPanel({ onAnswer }: AnswerPanelProps) {
  const studentSelf = useClassroomStore((s) => s.studentSelf);
  const [countdown, setCountdown] = useState(15);
  const [selected, setSelected] = useState<string | null>(null);
  const isCalled = studentSelf?.calledOn ?? false;

  useEffect(() => {
    if (!isCalled) {
      setCountdown(15);
      setSelected(null);
      return;
    }
    const t = setInterval(() => {
      setCountdown((x) => {
        if (x <= 1) { clearInterval(t); return 0; }
        return x - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isCalled]);

  const options = ['7', '8', '9', '10'];

  return (
    <div className="flex-1 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">📝 请作答</div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-lg tabular-nums">{countdown}s</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => {
              setSelected(opt);
              onAnswer?.(opt);
            }}
            disabled={!isCalled || selected !== null}
            className={`rounded-xl transition text-2xl font-bold disabled:opacity-60 ${
              selected === opt
                ? 'bg-sky-400 ring-2 ring-white/60'
                : 'bg-slate-700 hover:bg-sky-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <button className="py-2 rounded-xl bg-amber-500/90 hover:bg-amber-400 font-semibold text-sm">
          ✋ 举手抢答
        </button>
        <button className="py-2 rounded-xl bg-pink-500/90 hover:bg-pink-400 font-semibold text-sm">
          👏 击掌
        </button>
      </div>
    </div>
  );
}
