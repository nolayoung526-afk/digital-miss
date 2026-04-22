'use client';

import SceneList from '@/components/SceneList';
import SceneDetail from '@/components/SceneDetail';
import VariantPanel from '@/components/VariantPanel';
import { useEditorStore } from '@/store/editor';

export default function ScriptEditor() {
  const { scriptTitle, scriptVersion } = useEditorStore();

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* 顶栏 */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold">
            脚
          </div>
          <div>
            <div className="text-sm font-semibold">脚本编辑器 V2</div>
            <div className="text-xs text-slate-500">
              {scriptTitle} ·{' '}
              <span className="text-amber-600">{scriptVersion}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">💾 保存草稿</button>
          <button className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200">▶ 预览试讲</button>
          <button className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200">
            🤖 AI 预审
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500">
            提交审核 →
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 h-[calc(100vh-4rem)]">
        <SceneList />
        <SceneDetail />
        <VariantPanel />
      </main>
    </div>
  );
}
