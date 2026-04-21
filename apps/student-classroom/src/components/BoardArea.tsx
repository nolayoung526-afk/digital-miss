import { useClassroomStore } from '@/store/classroom';

/** 板书区 · 真实版本对接 @digital-teacher/board-engine */
export default function BoardArea() {
  const { boardText } = useClassroomStore();
  return (
    <div className="h-36 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 text-slate-900 relative p-4 shadow-lg">
      <div className="absolute top-2 left-3 text-[10px] font-semibold text-amber-700 uppercase tracking-wider">
        🖊 板书 {boardText && '· 老师正在写'}
      </div>
      <div className="h-full flex items-center justify-center">
        {boardText ? (
          <svg width="320" height="60" viewBox="0 0 320 60">
            <text x="20" y="44" fontSize="36" fontFamily="Cambria, Georgia, serif" fill="#78350f">
              {boardText}
            </text>
            <rect
              x="10" y="12" width="180" height="40" rx="4"
              fill="none" stroke="#dc2626" strokeWidth="2.5"
              strokeDasharray="440"
              strokeDashoffset="0"
            />
          </svg>
        ) : (
          <div className="text-slate-400 text-sm">等待数字人板书...</div>
        )}
      </div>
    </div>
  );
}
