# 豌豆思维数字人老师小班直播产品 · MVP

> **版本**: V1.3 · **阶段**: W0 开发启动 · **最后更新**: 2026-04-21

## 🎯 项目目标

用数字人老师补齐小班课师资缺口,以「标准化 + 个性化」的课堂体验兑现商业价值。

- 单课时师资成本 ↓ 40%
- 学员完课率 ≥ 85%
- 数字人 NPS ≥ 真人 -5 分
- 1 助教陪跑 3-5 个班级

完整 PRD:[飞书文档](https://www.feishu.cn/docx/PcMzdDXEroncOcxnio0cnGO0nBc)

## 🛠 技术栈(2026-04-21 锁定)

| 层 | 技术 | 理由 |
|---|---|---|
| **前端** | Next.js 15 (App Router) + React 18 + TypeScript | SSR/ISR · 文件路由 · API Routes 后续可用 |
| UI 库 | Tailwind CSS + shadcn/ui | 原型已使用,样式一致 |
| 状态 | Zustand(轻)/ TanStack Query(服务端) | 避免 Redux 模板代码 |
| **后端(主力)** | Java 21 + Spring Boot 3.x | 业务编排 / Orchestrator / Fallback |
| **后端(热点)** | Go 1.22 + Gin | 仅用于 RTC 信令网关等低延迟场景 |
| **算法服务** | Python 3.11 + FastAPI | 策略引擎 / 数字人渲染 |
| **数据库** | MySQL 8.0 | 业务主库 |
| **缓存** | Redis 7.x(Cluster) | 会话 / 策略 / 画像热缓存 |
| **消息队列** | Kafka 3.x(主)· RocketMQ 备选 | 埋点事件 + 业务异步 |
| **数据仓库** | Hologres / ClickHouse(二选一) | T+1 画像聚合 |
| **实时计算** | Flink 1.19 | 情绪/互动 5min 窗口聚合 |
| **RTC** | 声网 Agora(含 AINS) | PRD 卷四已锁定 |
| **LLM** | Anthropic Claude Haiku 4.5(主)· 国产备选 | 成本敏感 |
| **容器** | Docker + Kubernetes | 云原生部署 |

详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 📂 仓库结构

```
digital-teacher/
├── apps/                           # 前端应用
│   ├── teacher-console/            # 教研后台(脚本编辑器/Persona/策略规则)
│   ├── assistant-console/          # 助教工作台
│   ├── student-classroom/          # 学员课堂(Web + PWA)
│   ├── monitor-wall/               # 班主任监课台
│   ├── parent-app/                 # 家长端
│   └── barge-in-poc/               # 🔥 W0 · 声网 Barge-in PoC
├── services/                       # 后端服务
│   ├── digital-teacher-render/     # 数字人渲染(GPU, Python/PyTorch)
│   ├── class-orchestrator/         # 课堂编排(Node/Go)
│   ├── strategy-engine/            # 策略引擎(Python · Rule + Model)
│   ├── fallback-executor/          # FP 预案执行器
│   └── data-pipeline/              # Flink/Spark 数据管道
├── packages/                       # 共享包
│   ├── shared-types/               # TS 类型定义(卷三字段)
│   ├── rtc-sdk/                    # 声网 SDK 封装(含 Barge-in)
│   ├── board-engine/               # 板书引擎
│   ├── script-schema/              # 脚本 DSL + 校验
│   └── fp-playbook/                # 12 条 FP 预案配置
├── infra/                          # 基础设施
│   ├── docker/
│   ├── k8s/
│   └── terraform/
└── docs/                           # 研发文档
    ├── SPRINT_0.md                 # 🔥 W0 开发启动计划
    ├── ARCHITECTURE.md             # 系统架构(TBD W1)
    └── CONTRIBUTING.md             # 协作规范(TBD W1)
```

## 🚀 快速开始

### 前置依赖

```bash
# Node 20+
nvm install 20 && nvm use 20

# pnpm 9+
npm install -g pnpm@9

# Python 3.11+(算法/数据服务)
pyenv install 3.11 && pyenv global 3.11
```

### 安装与启动

```bash
# 克隆后
cd digital-teacher
pnpm install

# 运行 Barge-in PoC(W0 核心产出)
pnpm --filter barge-in-poc dev
# 浏览器打开 http://localhost:5173
```

### 环境变量

复制 `.env.example` 为 `.env.local`,填入:

```
VITE_AGORA_APP_ID=your_agora_app_id
VITE_AGORA_TOKEN=your_agora_token  # 可选,测试模式可留空
VITE_AGORA_CHANNEL=demo_channel
```

## 📋 W0 Sprint 目标

见 [docs/SPRINT_0.md](docs/SPRINT_0.md)

- [ ] 仓库骨架 + CI 模板
- [ ] 声网 Barge-in Web PoC 可运行
- [ ] 板书引擎 Canvas PoC 可运行
- [ ] Sprint 1 任务拆解
- [ ] 技术栈与规范对齐

## 🤝 协作规范(W1 完善)

- **Git**: 主干开发 + 特性分支 · `feat/` `fix/` `chore/` 前缀
- **Commit**: Conventional Commits(`feat:`, `fix:`, `docs:`, ...)
- **Code Review**: 至少 1 人 approve 才可合入
- **分支保护**: `main` 禁止直推,PR 必过 CI

## 📞 联系人

- **产品负责人**: TBD
- **研发负责人**: TBD
- **数据负责人**: TBD
- **教研负责人**: TBD

---

**MVP 上线目标**: 2026-08-30(灰度)· 2026-10-30(GA)
