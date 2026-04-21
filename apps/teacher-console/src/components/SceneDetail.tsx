import { useEditorStore } from '@/store/editor';

export default function SceneDetail() {
  const { scenes, currentSceneId, updateSceneTts } = useEditorStore();
  const scene = scenes.find((s) => s.sceneId === currentSceneId);
  if (!scene) return null;

  return (
    <section className="col-span-6 bg-white rounded-2xl shadow-sm p-5 overflow-y-auto">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-amber-600 font-semibold uppercase tracking-wide">
            当前编辑
          </div>
          <h2 className="text-xl font-bold mt-1">
            {scene.sceneId} · {scene.title}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            类型:{scene.type} · 预计时长 25s · 更新于 2 分钟前
          </p>
        </div>
        <div className="text-xs text-slate-500">
          #{scenes.findIndex((s) => s.sceneId === scene.sceneId) + 1} / {scenes.length}
        </div>
      </div>

      {/* 课件区 */}
      <section className="mb-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          📑 课件
        </h3>
        <div className="aspect-[16/9] max-h-48 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-xl flex items-center justify-center border border-slate-200">
          <div className="text-2xl">🍎 3 + 🍎🍎🍎🍎🍎 = ?</div>
        </div>
      </section>

      {/* 板书指令 */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            🖊 板书指令(H 引擎)
          </h3>
          <button className="text-xs text-indigo-600">+ 添加指令</button>
        </div>
        <div className="space-y-2">
          <BoardInstructionRow
            badge="write_text"
            badgeClass="bg-slate-900"
            content='pos: (200, 150) · content: "3 + 5 = ?"'
            duration="0.5s"
          />
          <BoardInstructionRow
            badge="rect"
            badgeClass="bg-red-500"
            content="pos: (180, 130, 280, 180) · color: red · 圈出问题"
            duration="0.3s"
          />
          <BoardInstructionRow
            badge="gesture"
            badgeClass="bg-amber-500"
            content="point_to: 课件 · 数字人举手指向"
            duration="1s"
            bgClass="bg-amber-50 border-amber-200"
          />
        </div>
      </section>

      {/* 话术 */}
      <section className="mb-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          🎙 话术(TTS + 唇形关键帧)
        </h3>
        <textarea
          value={scene.ttsText ?? ''}
          onChange={(e) => updateSceneTts(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          rows={2}
        />
        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
          <span>🎚 情绪:<strong className="text-slate-700">鼓励</strong></span>
          <span>⏱ 估算时长:<strong className="text-slate-700">2.4s</strong></span>
          <span>📋 变量:<code className="bg-slate-100 px-1 rounded">{'{{学员昵称}}'}</code></span>
        </div>
      </section>

      {/* 互动配置 */}
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          🎯 互动配置
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <InteractionCard label="类型" value="random_call" sub="优先随机邀请" tone="indigo" />
          <InteractionCard label="超时" value="15 秒" sub="受 K2 密度调节" tone="slate" />
          <InteractionCard label="题型权重" value="读 K10" sub="个性化渲染" tone="slate" />
        </div>
      </section>
    </section>
  );
}

function BoardInstructionRow({
  badge, badgeClass, content, duration, bgClass,
}: { badge: string; badgeClass: string; content: string; duration: string; bgClass?: string }) {
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${bgClass ?? 'bg-slate-50 border-slate-200'}`}>
      <span className={`px-2 py-0.5 rounded text-white text-[10px] font-mono ${badgeClass}`}>{badge}</span>
      <span className="flex-1 text-slate-700">{content}</span>
      <span className="text-xs text-slate-400">{duration}</span>
    </div>
  );
}

function InteractionCard({
  label, value, sub, tone,
}: { label: string; value: string; sub: string; tone: 'indigo' | 'slate' }) {
  const toneClasses =
    tone === 'indigo'
      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 [&_.v]:text-indigo-900'
      : 'bg-slate-50 border-slate-200 text-slate-500 [&_.v]:text-slate-900';
  return (
    <div className={`p-3 rounded-xl border ${toneClasses}`}>
      <div className="text-[10px] uppercase">{label}</div>
      <div className="v text-sm font-bold mt-1">{value}</div>
      <div className="text-[10px] mt-1">{sub}</div>
    </div>
  );
}
