# 贡献指南

> 欢迎协作!本文档涵盖分支策略 / Commit 规范 / PR 流程 / Code Review 原则。
> 详细技术栈见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · 首 Sprint 计划见 [docs/SPRINT_0.md](docs/SPRINT_0.md)。

## 🌲 分支策略

```
main              ← 受保护 · 禁直推 · PR 必经 · CI 必过
├── develop       ← 日常集成(大 Sprint 用 · MVP 阶段可直接用 main)
│   ├── feat/<ticket>-<short-desc>    ← 新功能
│   ├── fix/<ticket>-<short-desc>     ← Bug 修复
│   ├── chore/<ticket>-<short-desc>   ← 琐事(文档/CI/配置)
│   ├── refactor/<...>                ← 重构
│   └── perf/<...>                    ← 性能
└── release/v0.1  ← 发版冻结(Sprint 3+)
```

分支命名约束:
- 小写 · 用 `-` 分隔单词
- 带 Ticket 号优先(如 `feat/DT-101-takeover-api`)

## ✍️ Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <subject>

[可选 body]

[可选 footer]
```

**Type 清单**:

| type | 含义 |
|---|---|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档 |
| `style` | 代码样式(不改逻辑) |
| `refactor` | 重构(不新增功能/修 bug) |
| `perf` | 性能优化 |
| `test` | 测试 |
| `chore` | 琐事(CI / 配置 / 依赖) |
| `build` | 构建系统变更 |

**示例**:

```
feat(class-orchestrator): POST /live-class/{id}/warm 接口

- 绑定 Spring State Machine WARM 事件
- 签发学员 Agora Token(2h TTL)
- 发 class.lifecycle 事件

关联:DT-102
```

## 🔀 PR 流程

1. **建分支** → `git checkout -b feat/DT-123-xxx`
2. **开发 + 自测** → 本地 `mvn test` / `pnpm typecheck` / `pytest`
3. **提交**(多个小 commit 可接受,但合入时 squash)
4. **推分支** → `git push -u origin feat/DT-123-xxx`
5. **开 PR** → 用模板填写背景/改动/测试/风险
6. **等 CI 全绿** → GitHub Actions 会按 `path-filter` 只跑受影响模块
7. **等 Review** → 至少 1 人 approve,涉及多 Team 时按 [`CODEOWNERS`](.github/CODEOWNERS) 自动指派
8. **合并方式**:
   - 小 PR(< 5 commits)→ **Squash and merge**
   - 大 PR(> 5 commits,保留清晰历史)→ **Rebase and merge**
   - **禁止 Merge commit**(保持 main 线性)

## 🔍 Code Review 原则

Reviewer 看什么:
- ✅ 正确性(业务逻辑 / 边界 / 异常)
- ✅ 安全(无硬编码密钥 / SQL 注入 / XSS)
- ✅ 合规(不引入受保护属性 · 卷六红线)
- ✅ 性能(N+1 查询 / 锁粒度 / GC)
- ✅ 测试覆盖(关键逻辑 ≥ 70%)
- ✅ 日志 / 埋点 / 监控

Reviewer **不** 过度纠结:
- ❌ 个人代码风格偏好(交给 Lint 工具)
- ❌ 重写式建议(留给下个 PR 或 refactor 专题)

回复规范:
- `nit:` 建议性 · 可不改(如命名微调)
- `ask:` 提问 · 帮我理解
- `request:` 必须改
- `blocker:` 阻塞合入

## 🎨 代码规范

各语言一致使用工具强制:

| 语言 | 工具 |
|---|---|
| TypeScript / React | ESLint + Prettier(根 `eslint.config.js`) |
| Java | Checkstyle + SpotBugs + Spotless(根 `pom.xml`) |
| Python | Ruff + Black(`pyproject.toml` 内配置) |
| SQL | sqlfluff(`infra/mysql` 目录) |
| Shell | ShellCheck |

提交前 pre-commit hook 自动跑(建议装 [pre-commit](https://pre-commit.com))。

## 🔐 安全与合规

**提交前自检**:

- [ ] 没有 `.env.local` / `*.key` / `id_rsa` 进仓库(见 `.gitignore`)
- [ ] 日志不打印学员 PII(姓名/手机号/身份证)
- [ ] 策略规则不用受保护属性(gender/ethnicity/region/income_level)
- [ ] 数字人画面保留 AI 标识(`<AIBadge>` 组件强制挂载)
- [ ] 情绪识别原始帧不出端

详见 [`SECURITY.md`](SECURITY.md)。

## 🏷️ Issue 标签

| Label | 用途 |
|---|---|
| `P0` / `P1` / `P2` / `P3` | 优先级 |
| `bug` / `enhancement` / `question` | 类型 |
| `frontend` / `backend` / `algorithm` / `data` / `infra` | 归属 |
| `good first issue` | 新人友好 |
| `help wanted` | 外部协作欢迎 |
| `compliance` | 合规相关(法务需过) |

## 📞 联系方式

| 角色 | 联系方式 |
|---|---|
| 产品负责人 | TBD |
| 研发负责人 | TBD |
| 数据负责人 | TBD |
| 教研负责人 | TBD |
| 合规 / 法务 | TBD |

## 📚 延伸阅读

- [架构文档](docs/ARCHITECTURE.md)
- [Sprint 0 计划](docs/SPRINT_0.md)
- [飞书 PRD 合集 V1.3](https://www.feishu.cn/docx/PcMzdDXEroncOcxnio0cnGO0nBc)
- [CODEOWNERS](.github/CODEOWNERS)
- [SECURITY](SECURITY.md)
