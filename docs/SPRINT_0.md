# Sprint 0 · 开发启动周计划

> **周期**: W0(1 周 · 5 工作日)
> **目标**: 让 Sprint 1 能零摩擦起跑
> **原则**: 重要的事先做,不重要的不做

---

## ✅ 技术栈(2026-04-21 已锁定)

| 层 | 选型 | 用在哪 |
|---|---|---|
| 前端 | **React 18 + TypeScript + Vite** | 5 个 apps |
| UI | Tailwind + shadcn/ui | 全端统一 |
| 后端主力 | **Java 21 + Spring Boot 3.3** | class-orchestrator · fallback-executor · teacher-asset-mgr 等业务服务 |
| 后端热点 | **Go 1.22**(按需) | RTC 信令网关 · VAD 边缘聚合(W4+ 压测后决策) |
| 算法 | Python 3.11 + FastAPI | strategy-engine · digital-teacher-render |
| 数据库 | **MySQL 8** | 业务主库 |
| 缓存 | **Redis 7 Cluster** | 会话 / 策略 / 画像热缓存 · 分布式锁 |
| 消息 | **Kafka 3.x** 主 · RocketMQ 备选 | 埋点 + 业务异步 |
| OLAP | Hologres / ClickHouse | DWS 画像存储 |
| 实时 | Flink 1.19 | 5min 窗口聚合 + 反事实告警 |
| RTC | **声网 Agora**(含 AINS) | 已锁定,MVP 绕不开 |
| LLM | Claude Haiku 4.5(主) · 国产备选 | 成本敏感 |

详见 [ARCHITECTURE.md](ARCHITECTURE.md)

## 🎯 本周目标(Definition of Done)

- [x] 仓库骨架就绪(本周已完成)
- [ ] 声网 Barge-in Web PoC 可跑通(淡出 ≤ 500ms,续播起讲 ≤ 1500ms)
- [ ] 板书引擎 Canvas PoC 可跑通(write_text / rect / clear 三项)
- [ ] 技术栈锁定(前端 / 后端 / 算法 / 数据 / 基建)
- [ ] Sprint 1 任务拆解并分配 Owner
- [ ] 研发规范文档(Git / Commit / Review / CI)就绪
- [ ] 核心密钥申请到位(声网 AppID / 云 GPU 配额 / Kafka / Hologres 等)

---

## 📅 日历(周一开工)

### Day 1 · 周一 · 对齐 & 申请

| 时间 | 事项 | Owner | 产出 |
|---|---|---|---|
| 09:30-10:30 | 项目 kickoff 全员会 | PM | 会议纪要 + 责任人列表 |
| 10:30-12:00 | ~~技术栈评审~~ ✅ **已锁定** · 改为:详设对齐(Spring Boot 版本 / Kafka 配置) | 研发 LD | 决议 |
| 14:00-15:00 | 采购立项会(声网 / GPU / 三方 TTS/ASR) | 采购 + 研发 LD | 报价表 · 合同模板 |
| 15:00-17:00 | 密钥与账号申请(内部 SSO / 云平台 / Kafka / MySQL / Redis) | 基建 L1 | 清单 ✅ |
| 17:00-18:00 | 走读 PRD 卷三 + 本仓库 `infra/mysql/schema.sql` · 确认字段无歧义 | 前 + 后 LD | 字段 issue 清单 |

### Day 2 · 周二 · PoC 启动

| 时间 | 事项 | Owner | 产出 |
|---|---|---|---|
| 全天 | 声网 Barge-in PoC Real 模式接入(替换 Mock) | 前端 L2 + 算法 L2 | Agora SDK + AINS 跑通 |
| 全天 | 板书引擎 Canvas PoC(独立库) | 前端 L3 | write_text 动画 Demo |
| 16:00-17:00 | 数据平台现状复核(Flink/Spark/Hologres 是否已有) | 数据 LD | 复用 vs 新建决议 |

### Day 3 · 周三 · PoC 迭代 + 规范

| 时间 | 事项 | Owner | 产出 |
|---|---|---|---|
| 全天 | Barge-in PoC 完善:意图分类 Mock → 真调 LLM(Haiku) | 算法 L2 | 意图分类 F1 ≥ 85% |
| 全天 | 板书引擎完善:rect / clear / undo 动画 | 前端 L3 | 4 种动作 Demo |
| 14:00-16:00 | 研发规范文档起草(Git Flow / Commit / Review) | 研发 LD | `docs/CONTRIBUTING.md` |
| 16:00-17:00 | CI 模板配置(GitHub Actions:typecheck + lint + test) | 基建 L1 | PR 自动触发 |

### Day 4 · 周四 · 联调 + Sprint 1 拆解

| 时间 | 事项 | Owner | 产出 |
|---|---|---|---|
| 09:30-11:30 | PoC 联调:Barge-in + 板书在同页面 | 前端团队 | 联调视频 Demo |
| 14:00-17:00 | **Sprint 1 任务拆解工作坊**(全体研发) | PM + 各 LD | Sprint 1 Backlog |
| 17:00-18:00 | Sprint 1 Owner 分配确认 | PM | 任务表(见下) |

### Day 5 · 周五 · 收尾 + Demo

| 时间 | 事项 | Owner | 产出 |
|---|---|---|---|
| 09:30-11:00 | 研发规范 Review(全体) | 研发 LD | 修订 PR |
| 14:00-15:30 | **Sprint 0 Demo Day**(全员 + 产品 + 业务) | PM | Demo 视频 + 反馈记录 |
| 15:30-17:00 | 回顾会(What went well / What didn't) | PM | Action items |
| 17:00-18:00 | Sprint 1 开工!启动 Day 1 任务 | — | — |

---

## 🧩 Sprint 1 Backlog(拆解样例 · 供周四工作坊输入)

### 前端线

| # | 任务 | Story Points | 验收 |
|---|---|---|---|
| FE-01 | 学员课堂页骨架(声网订阅 + 字幕) | 5 | 能看到数字人主画面 + 字幕 |
| FE-02 | 集成 board-engine 到课堂页 | 3 | 板书分镜驱动正常 |
| FE-03 | 助教工作台骨架(一键接管按钮) | 5 | 按钮触发 takeover API |
| FE-04 | 互动区组件(选择题 / 举手) | 3 | 组件可用 |
| FE-05 | 课堂页端到端演示联调 | 5 | 1 节 40min 空跑 |

### 后端线(Java Spring Boot)

| # | 任务 | SP | 验收 |
|---|---|---|---|
| BE-01 | class-orchestrator 骨架(Spring Boot 3.3 + MyBatis-Plus + 健康检查) | 5 | /actuator/health OK |
| BE-02 | `POST /live-class/create` 接口 + MySQL 建表 + Agora Token 签发 | 5 | 可创建 + 返回 RTC token |
| BE-03 | `POST /takeover` 接口 + Redisson 分布式锁 + Stream Message 转发 | 5 | 3s 内生效 |
| BE-04 | fallback-executor 骨架 + Spring State Machine + FP-01 跑通 | 8 | 模拟故障触发 FP-01 |
| BE-05 | interaction-gateway Kafka Producer + 6 类事件 Schema 校验 | 5 | 事件入 Kafka |
| BE-06 | Redis 会话 + RTC Token 缓存(Lettuce + `sess:` / `rtc:token:` key) | 3 | 命中率 > 80% |

### 算法 + 数字人线(Python)

| # | 任务 | SP | 验收 |
|---|---|---|---|
| AL-01 | TTS 双通道封装 + fade_out API | 5 | 200ms 淡出可控 |
| AL-02 | Barge-in 控制器服务化(Python + FastAPI) | 8 | PoC 逻辑移到服务端 |
| AL-03 | 唇形驱动部署 + Wav2Lip INT8 量化 | 8 | 单节成本 ≤ ¥5 |
| AL-04 | 意图分类服务(LLM Haiku 接入) | 3 | API P95 ≤ 300ms |

### 数据线

| # | 任务 | SP | 验收 |
|---|---|---|---|
| DA-01 | Kafka 集群搭建 · 6 topic 创建(按 `infra/mq/topics.md`) | 3 | topic 可写可读 |
| DA-02 | 埋点 SDK(Java 生产者封装)+ Schema Registry | 5 | 6 类事件类型可发 |
| DA-03 | ODS 层表建模 + Flink CDC / Kafka Source 入 Hologres | 5 | Hologres 可查 |
| DA-04 | strategy-engine 骨架(FastAPI + 3 条 MVP 规则 YAML) | 8 | 规则命中率可看 |
| DA-05 | 反事实监控规则(Flink 实时 DAG) | 3 | 模拟回退告警 |

### 测试 + 基建

| # | 任务 | SP | 验收 |
|---|---|---|---|
| QA-01 | 测试框架选型(Playwright E2E · Vitest 前端 · JUnit + Testcontainers 后端 · Pytest 算法) | 2 | CI 已集成 |
| QA-02 | 核心链路 E2E 用例 5 条(创建课堂→接管→FP→结束) | 5 | 全绿 |
| IN-01 | K8s 命名空间 + GPU Node 池 + MySQL/Redis/Kafka RDS 实例 | 5 | 可调度 |
| IN-02 | CI/CD 流水线(Maven + pnpm + Pytest · Build → Test → Deploy dev) | 5 | PR 自动部署 dev |
| IN-03 | `infra/mysql/schema.sql` 自动执行(Flyway / Liquibase) | 3 | 数据库迁移可重放 |

**Sprint 1 合计**: ~ 100 SP · 按团队产能拆 2-3 周

---

## 🔑 必须本周完成的"阻塞项"

> 这些不搞定,Sprint 1 寸步难行。

| 阻塞项 | 责任人 | 死线 |
|---|---|---|
| 声网 Agora 账号 + AppID + Token Server | 研发 LD + 采购 | 周二下班 |
| 云 GPU 配额申请(≥ 4× A10 for dev)| 基建 L1 | 周三下班 |
| **MySQL 8 实例 + Redis Cluster + Kafka 集群 申请** | 基建 L1 | 周三下班 |
| **Maven 私服 / pnpm 私源接入**(Nexus / Verdaccio) | 基建 L1 | 周二下班 |
| Hologres 实例申请(或 ClickHouse 二选一) | 数据 LD | 周三下班 |
| LLM API 密钥(Claude Haiku)| 算法 LD | 周二下班 |
| 教研样本脚本 1 份(供 Sprint 1 调试)| 教研 LD | 周四下班 |
| Persona 克隆样本素材(王老师视频 + 音频)| 教研 + HR | 周五下班 |
| 法务复核授权书模板 v0.9 | 法务 | 周五下班 |

---

## 📏 规范:Sprint 0 建立,后续遵守

### Git 分支策略

```
main              ← 受保护,只能通过 PR 合入
├── develop       ← 日常开发集成分支
│   ├── feat/<ticket-id>-<short-desc>    ← 新功能
│   ├── fix/<ticket-id>-<short-desc>     ← Bug 修复
│   └── chore/<ticket-id>-<short-desc>   ← 琐碎
└── release/v0.1  ← 发版前冻结
```

### Commit 规范(Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

`type`: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore`

例:`feat(board-engine): 实现 write_text 手写动画`

### PR 规范

- 至少 1 人 approve 才能合
- 必过 CI(typecheck + lint + test)
- Description 必填:背景 · 改动 · 测试 · 风险
- 关联 issue / ticket

### 代码规范

- TS / JS: ESLint + Prettier(配置在仓库根)
- **Java: Checkstyle + SpotBugs + Spotless**(强制格式化,配置在根 `pom.xml`)
- Python: Ruff + Black
- Go: gofmt + golangci-lint
- **SQL: sqlfluff**(MySQL 方言)

---

## 🎯 周五 Demo Day 演示清单

| # | 演示项 | 负责人 | 时长 |
|---|---|---|---|
| 1 | Barge-in PoC 现场跑通(播放长段 → 打断 → 续播) | 前端 L2 | 5 min |
| 2 | 板书引擎动画展示 | 前端 L3 | 3 min |
| 3 | 数据管道入仓 Demo(发一条 T_BOARD_WRITE → Hologres 查到) | 数据 L1 | 3 min |
| 4 | 技术栈最终决议 | 研发 LD | 5 min |
| 5 | Sprint 1 Backlog 走查 + 估时 | PM | 10 min |
| 6 | 阻塞项确认 + 风险 | PM | 5 min |
| **合计** | | | **~30 min** |

---

## 📞 联系人(本周待填)

| 角色 | 姓名 | 飞书 | 备用 |
|---|---|---|---|
| 产品 PM | | | |
| 研发 LD | | | |
| 前端 LD | | | |
| 后端 LD | | | |
| 算法 LD | | | |
| 数据 LD | | | |
| 基建 LD | | | |
| 教研 LD | | | |
| QA LD | | | |

---

## ⚠️ W0 风险项(每日晨会过一遍)

| 风险 | 缓解 |
|---|---|
| 声网合同未签,PoC 仅跑 Mock | 即使 Mock 也能验证控制逻辑,不阻塞 |
| GPU 资源未到位,算法无法训练量化 | 先用 CPU Mock 推流,验证链路 |
| 教研样本脚本未到位 | 产品手写 3 个分镜作为临时样本 |
| 法务授权书未复核,Persona 采集卡住 | 先用内部同事样本做测试,不对外 |

---

## 🚀 下一步(Sprint 1 开工)

Sprint 0 Demo Day 通过后,**下周一 9:30 Sprint 1 开工会**,进入 W1-W2 正式开发。

Sprint 1 目标:**端到端 Hello World —— 1 节 5 分钟空课跑通(无真实学员,数字人单讲单写,助教能接管)**。
