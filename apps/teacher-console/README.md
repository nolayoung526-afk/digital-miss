# 教研后台(Teacher Console)

> 📅 **启动**:Sprint 2(W3-W4) · 负责人:前端 L1
> 🛠 **技术栈**:React 18 + Vite + Tailwind + Zustand

## 功能范围(MVP)

- 🔥 **脚本编辑器 V2**(已产出)· 参考 [prototype_script_editor.html](../../../prototype_script_editor.html)
- Persona 克隆工作台(Sprint 2 补)
- 策略规则后台(Sprint 2 补)
- FP 预案库编辑(Sprint 3 补)
- 学情复盘看板(Sprint 3 补)

## 🚀 快速启动

```bash
cd /Users/yangxiasi/Desktop/goo/digital-teacher
pnpm --filter teacher-console dev
# → http://localhost:5175
```

## 📁 代码结构

```
teacher-console/
├── index.html
├── vite.config.ts · tsconfig.json · tailwind / postcss
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   └── ScriptEditor.tsx    # 🔥 三栏布局主页
│   ├── components/
│   │   ├── SceneList.tsx       # 左:分镜列表(状态颜色/变体数)
│   │   ├── SceneDetail.tsx     # 中:课件 + 板书指令 + 话术 + 互动
│   │   └── VariantPanel.tsx    # 右:4 种变体 + 奖励策略 + AI 预审
│   ├── lib/
│   │   └── api.ts              # 保存/审核/AI 预审接口封装
│   └── store/
│       └── editor.ts           # Zustand 编辑器状态
```

## 🎯 亮点

- **学员画像变体** 4 类一目了然(default / confused / high / asr)· 对应策略引擎 6 规则
- **板书指令**(write_text / rect / gesture)列出,与 board-engine 对齐
- **AI 预审建议**卡片 · 占位接入 LLM(卷七 Token 模型 · Haiku 负责)

## ⏭ Sprint 2 补齐

- [ ] 对接 class-orchestrator:`PUT /api/v1/script/{id}`(保存)· `POST /submit`(审核)
- [ ] Persona 克隆工作台页(复用 [prototype_persona_clone.html] 草稿)
- [ ] 策略规则后台页(CRUD + 灰度滑块 + 效果看板)
- [ ] 草稿自动保存(localStorage + debounce)
- [ ] 审核链路 SSE 实时推送
