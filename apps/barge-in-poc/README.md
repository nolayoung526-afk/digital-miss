# 声网 Barge-in PoC

> 📅 **阶段**:W0 技术验证
> 🛠 **技术栈**:Next.js 15(App Router) + React 18 + TypeScript + Tailwind + Web Audio API

## 验证目标

验证数字人老师在 TTS 播放过程中,被学员语音打断后的优雅响应链路:

- **淡出时延 ≤ 500ms**:学员开口 → 数字人切 `listening`
- **续播起讲 ≤ 1500ms**:学员停止说话 → 从断点字符位续讲
- **断点记录**:`scene_id` + `char_offset` 精确到字符
- **意图分类(Mock)**:区分 noise / question / confirmation,决定续播/回答/鼓励

## 🚀 快速启动

```bash
cd /Users/yangxiasi/Desktop/goo/digital-teacher
pnpm install
pnpm --filter barge-in-poc dev
# → http://localhost:5173
```

## 🧪 如何测试

1. 点击 "▶ 播放长段" 启动 TTS
2. 点击 🎙 打开麦克风(需授权,首次会申请权限)
3. TTS 播放中,对麦克风说 "老师老师"
4. 观察:数字人 300ms 内切 `listening`,字幕淡出
5. 停止说话,观察:从断点续讲,加过渡句 "好,我们继续..."

## 📁 代码结构

```
barge-in-poc/
├── next.config.ts
├── tsconfig.json · tailwind.config.mjs · postcss.config.mjs
├── src/
│   └── app/
│       ├── layout.tsx          # 根 layout
│       ├── page.tsx            # 🔥 PoC 主页("use client")· 含 VAD + TTS + Barge-in 状态机
│       └── globals.css         # Tailwind + 自定义动画
```

## 🔧 实现要点

- **VAD**:`AnalyserNode` + `requestAnimationFrame` · 阈值 -42 dBFS · 最小持续 300ms
- **TTS**:浏览器内置 `SpeechSynthesisUtterance`(上线切声网 TTS)
- **断点记录**:`onboundary` 实时记录 `charIndex`,打断时 `speechSynthesis.cancel()` 并保存 offset
- **续播**:`thinking` → 过渡句 + `substring(charOffset)`,度量起讲时延

## ⏭ 后续(接真实声网)

- [ ] 替换浏览器 TTS → 声网 TTS Server SDK
- [ ] 替换 `AnalyserNode` → 声网 AINS 输出的 VAD 事件
- [ ] 接入 `intent-classifier`(Python 微服务)替代 Mock
- [ ] 将指标(淡出时延 / 续播起讲 / 打断次数)上报 `interaction.events` Kafka
