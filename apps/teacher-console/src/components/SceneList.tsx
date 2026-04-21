import clsx from 'clsx';
import { useEditorStore } from '@/store/editor';

const STATUS_DOT: Record<string, string> = {
  approved: 'bg-emerald-500',
  editing: 'bg-amber-500',
  draft: 'bg-slate-400',
};

const STATUS_LABEL: Record<string, string> = {
  approved: '已审核通过',
  editing: '编辑中',
  draft: '未填写',
};

export default function SceneList() {
  const { scenes, currentSceneId, setCurrentScene } = useEditorStore();

  return (
    <aside className="col-span-2 bg-white rounded-2xl shadow-sm p-3 overflow-y-auto">
      <div className="flex items-center justify-between px-2 pb-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          分镜列表 ({scenes.length})
        </h2>
        <button className="text-xs text-indigo-600 hover:text-indigo-500">+ 添加</button>
      </div>
      <ul className="space-y-1.5">
        {scenes.map((s) => {
          const active = s.sceneId === currentSceneId;
          return (
            <li
              key={s.sceneId}
              onClick={() => setCurrentScene(s.sceneId)}
              className={clsx(
                'p-2 rounded-xl cursor-pointer transition border',
                active
                  ? 'bg-amber-50 border-2 border-amber-400'
                  : `border-slate-200 hover:bg-slate-50 ${
                      s.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-200'
                        : s.status === 'draft'
                        ? 'bg-slate-50'
                        : 'bg-white'
                    }`
              )}
            >
              <div className="flex items-center gap-2">
                <span className={clsx('w-2 h-2 rounded-full', STATUS_DOT[s.status])} />
                <span className={clsx('text-xs', active ? 'font-bold' : 'font-medium')}>
                  {s.sceneId} {s.title}
                  {active && ' ▶'}
                </span>
              </div>
              {active && s.variantCount && (
                <div className="text-[10px] text-amber-700 mt-1">
                  编辑中 · {s.variantCount} 个变体
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 p-2 rounded-xl bg-slate-50 text-[10px] text-slate-500 space-y-1">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <span className={clsx('w-2 h-2 rounded-full', STATUS_DOT[k])} />
            {v}
          </div>
        ))}
      </div>
    </aside>
  );
}
