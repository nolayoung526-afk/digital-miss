# 学员课堂(Student Classroom)

> 📅 **启动**:Sprint 1(W1-W2) · 负责人:前端 L2
> 🛠 **技术栈**:React 18 + TypeScript + Vite 5 + Tailwind 3 + 声网 Web SDK 4

## 功能范围

- 数字人主画面订阅(声网 RTC)+ 字幕 + AI 标识
- 板书区(对接 `@digital-teacher/board-engine`)
- 学员小窗 + 被点名交互 + 上台动画
- 答题区(选择题 + 举手 + 击掌)
- 奖励动画(⭐ / 红包雨 / 撒花)· TODO:Sprint 2
- "今天为你的特别安排"入口(家长端共用组件)· TODO:Sprint 2
- AINS 降噪三档切换

参考原型:[../../../prototype_student_classroom.html](../../../prototype_student_classroom.html)

## 🚀 快速启动

```bash
cd /Users/yangxiasi/Desktop/goo/digital-teacher
pnpm install                              # 安装 workspace 依赖

pnpm --filter student-classroom dev       # 启动
# → http://localhost:5174
```

演示模式(无后端):启动后会自动跑一遍模拟分镜流程(讲解 → 点名 → 鼓励)。

## 📁 代码结构

```
student-classroom/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── src/
│   ├── main.tsx                 # 入口
│   ├── App.tsx                  # 路由(MVP 单页)
│   ├── pages/
│   │   └── Classroom.tsx        # 🔥 主课堂页
│   ├── components/
│   │   ├── DigitalTeacherView.tsx   # 数字人主画面(+AI 标识)
│   │   ├── StudentGrid.tsx      # 学员九宫格
│   │   ├── BoardArea.tsx        # 板书 SVG
│   │   ├── AnswerPanel.tsx      # 答题倒计时
│   │   └── BottomBar.tsx        # 个性化 + AINS 切换
│   ├── lib/
│   │   ├── agora.ts             # 声网 SDK 封装(AgoraClient)
│   │   └── api.ts               # class-orchestrator HTTP 调用
│   ├── store/
│   │   └── classroom.ts         # Zustand 全局状态
│   └── styles/
│       └── index.css
```

## 📌 当前状态

| 能力 | 状态 | 备注 |
|---|---|---|
| UI 骨架 + 状态管理 | ✅ | Zustand store 完备 |
| 模拟分镜 Demo | ✅ | Classroom.tsx 内的 useEffect |
| 声网 SDK 封装(AgoraClient) | ✅ | lib/agora.ts · 单例 + 订阅 + Stream Msg 占位 |
| AINS 三档切换(UI) | ✅ | 底栏可切 |
| 板书 SVG 动画 | ✅ | 真实版本调 board-engine |
| 后端集成 | ⏳ Sprint 1 | 等 class-orchestrator 完成 `/join-token` 接口 |
| 家长端复用组件 | ⏳ Sprint 2 | "今天为你的特别安排" 抽公共组件 |

## 🔧 环境变量

复制 `.env.example` 为 `.env.local`:

```
VITE_AGORA_APP_ID=your_app_id
VITE_API_BASE=/api
```

Real 模式(接入真实声网)需要你的 Agora AppID。

## 🧪 Sprint 1 Day 1 续做

1. 对接 class-orchestrator `POST /api/v1/live-class/{id}/join-token` 获取真实 Token
2. `AgoraClient.join()` 真正入频道 + 播放远端视频流
3. 埋点:按下答题按钮 → POST `interaction.events`
4. 补 E2E 测试(Playwright)
