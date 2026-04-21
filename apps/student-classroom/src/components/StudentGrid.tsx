import { useClassroomStore } from '@/store/classroom';
import clsx from 'clsx';

const AVATARS = ['😊', '🦊', '🐰', '🐻'];

/** 学员小窗(九宫格 · 支持被点名高亮 + 上台聚焦) */
export default function StudentGrid() {
  const { studentSelf, classmates } = useClassroomStore();
  const all = studentSelf ? [studentSelf, ...classmates] : classmates;

  return (
    <div className="grid grid-cols-2 gap-2">
      {all.map((s, i) => (
        <div
          key={s.id}
          className={clsx(
            'aspect-video rounded-xl relative p-2 border-2',
            s.calledOn
              ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-300 animate-ring-pulse'
              : 'bg-slate-700 border-transparent'
          )}
        >
          <div
            className={clsx(
              'absolute inset-0 flex items-center justify-center text-5xl',
              !s.calledOn && 'opacity-60'
            )}
          >
            {AVATARS[i] ?? '🧒'}
          </div>
          <span
            className={clsx(
              'absolute top-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold',
              s === studentSelf
                ? 'bg-white text-amber-700'
                : 'bg-black/50 text-white'
            )}
          >
            {s === studentSelf ? `我 · ${s.nickname}` : s.nickname}
          </span>
          {s.calledOn && (
            <span className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-red-500 text-white font-bold animate-bounce-soft">
              被点名
            </span>
          )}
          <span className="absolute bottom-1.5 left-1.5 text-xs">
            {s.onMic ? '🎙' : '🔇'}
          </span>
        </div>
      ))}
    </div>
  );
}
