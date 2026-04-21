# 系统架构

> 版本 V1.0 · 2026-04-21 · 基于 PRD 卷四技术架构 + W0 技术栈决议

## 一、总体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        客户端(React 18 + TS)                       │
│   教研后台 · 助教工作台 · 学员课堂 · 监课台 · 家长 App              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTPS + WebSocket + Agora RTC
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API 网关(Spring Cloud Gateway / Nginx)          │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌────────────┐        ┌────────────┐         ┌────────────┐
│ Java 业务层 │        │ Python 算法层 │       │ Go 热点层   │
│ Spring Boot │        │ FastAPI      │       │ (可选)     │
├────────────┤        ├────────────┤         ├────────────┤
│ class-      │        │ strategy-  │         │ rtc-       │
│ orchestrator│───────▶│ engine     │         │ signaling- │
│            │        │            │         │ gateway    │
│ fallback-  │        │ digital-   │         │            │
│ executor   │        │ teacher-   │         │ (W4+ 按需)│
│            │        │ render     │         │            │
│ teacher-   │        └────────────┘         └────────────┘
│ asset-mgr  │              │
└─────┬──────┘              │
      │                     │
      ├─ MySQL 8 ───────────┤
      ├─ Redis 7 Cluster ───┤
      ├─ Kafka 3.x ─────────┤────▶ data-pipeline
      └─ OSS(素材)───────┘           │
                                      ▼
                          ┌─────────────────────┐
                          │  Flink 实时 / Spark  │
                          │  Hologres 画像存储  │
                          └─────────────────────┘
                                      │
                                      ▼
                                ← 策略引擎 ←
```

## 二、服务清单与技术选型

### 2.1 Java 业务服务(Spring Boot 3.x + JDK 21)

| 服务 | 职责 | 主要依赖 |
|---|---|---|
| **class-orchestrator** | 课堂编排:生命周期 / 调度 / 信令转发 | Spring Web + WebFlux · MyBatis-Plus · Redis · Kafka Client |
| **fallback-executor** | FP 预案执行器 | Spring State Machine · Kafka · Redis |
| **teacher-asset-mgr** | Persona / 脚本资产管理 | Spring Web · Spring Security · OSS SDK |
| **interaction-gateway** | 埋点接收 / 事件分发 | Spring WebFlux · Kafka Producer |
| **auth-service** | 学员 / 助教 / 教研 多角色认证 | Spring Security + JWT · Redis |

**共用规范**:
- 框架:Spring Boot 3.3+
- ORM:MyBatis-Plus(简单场景)· JOOQ(复杂 SQL)
- 连接池:HikariCP(MySQL)· Lettuce(Redis)
- 配置中心:Nacos / Apollo
- 日志:Logback + SLS / ELK
- Trace:OpenTelemetry → Jaeger
- API 文档:SpringDoc OpenAPI 3

### 2.2 Python 算法服务(FastAPI + Python 3.11)

| 服务 | 职责 | 关键依赖 |
|---|---|---|
| **strategy-engine** | 规则 + 模型 · 生成 StrategyConfig | FastAPI · PyYAML · scikit-learn · PyTorch(V2) |
| **digital-teacher-render** | TTS + 唇形 + 表情 + 渲染推流 | PyTorch 2.x · ONNX Runtime · Agora Server SDK |
| **intent-classifier** | Barge-in 意图分类 | Transformers(小模型)· Haiku API 兜底 |

### 2.3 Go 热点服务(按需启用)

| 服务 | 启用时机 | 原因 |
|---|---|---|
| **rtc-signaling-gateway** | W4+(并发 > 5000 时考虑) | WebSocket 长连接密集 · Java 线程模型压力大 |
| **vad-edge-aggregator** | W6+ | 打断事件高频上报,需低延迟聚合 |

MVP 阶段全部用 Java 起步,如压测出现瓶颈再切 Go。

### 2.4 前端应用(React 18 + TypeScript)

| 应用 | 特殊要求 |
|---|---|
| teacher-console | 需支持复杂表单 · 草稿自动保存 · 实时审核状态推送(SSE) |
| student-classroom | 声网 Web SDK · 低延迟渲染(Framer Motion) · PWA 离线能力 |
| assistant-console | 高频实时数据面板 · WebSocket 多订阅 |
| monitor-wall | 多视频流同屏 · 节流渲染 |
| parent-app | 移动优先 · Capacitor 打包 iOS/Android |

**共用基础**:
- Vite 5 · TypeScript 5.6 · Tailwind CSS 3.x
- 路由:TanStack Router
- 数据:TanStack Query + Zustand
- 国际化:react-i18next(为国际化预留)
- UI:shadcn/ui + Radix Primitives

## 三、数据层

### 3.1 MySQL(业务主库)

- **引擎**:InnoDB · 字符集 utf8mb4
- **分库分表**:MVP 单库 · GA 后按 class_id / student_id 分片
- **读写分离**:MVP 不做 · GA 后上 ProxySQL
- **表清单**:详见 [infra/mysql/schema.sql](../infra/mysql/schema.sql)

关键表:
- `teacher_personas` · `scripts` · `scenes` · `live_classes`
- `students` · `assistants` · `fallback_playbooks`
- `strategy_rules` · `audit_logs`

### 3.2 Redis(7.x Cluster)

**主要用途**:
- 会话:`sess:{user_id}` · TTL 7d
- RTC Token 缓存:`rtc:token:{class_id}` · TTL 2h
- 策略热缓存:`strategy:{class_id}:next` · TTL 1h
- 画像热缓存:`profile:student:{student_id}` · TTL 15min
- 分布式锁:`lock:takeover:{class_id}` · TTL 30s
- 限流:`rate:bargein:{class_id}:{student_id}` · 滑窗

详见 [infra/redis/keys.md](../infra/redis/keys.md)

### 3.3 Kafka(事件总线)

**Topic 清单**:

| Topic | 分区 | 保留 | 生产者 | 消费者 |
|---|---|---|---|---|
| `interaction.events` | 32 | 7d | interaction-gateway | data-pipeline · 策略引擎 |
| `emotion.signals` | 16 | 3d | 客户端(端侧模型) | data-pipeline |
| `fallback.triggers` | 8 | 30d | class-orchestrator | fallback-executor · 告警 |
| `takeover.events` | 8 | 30d | class-orchestrator | 数据 + 告警 |
| `strategy.applied` | 8 | 7d | strategy-engine | data-pipeline |
| `class.lifecycle` | 16 | 90d | class-orchestrator | 数据 + 账单 |

详见 [infra/mq/topics.md](../infra/mq/topics.md)

### 3.4 Hologres / ClickHouse(数据仓库)

- **定位**:OLAP 聚合分析(画像 · 学情报告 · BI)
- **主要表**:`dws_student_profile` · `dws_class_profile` · `dws_cohort_profile`
- **更新**:Flink 实时 + Spark T+1 批

## 四、部署架构

```
生产环境(华北 Region 主 · 华东 Region 备)
├── K8s Cluster(业务层)
│   ├── Java 微服务(Spring Boot · 6 个服务 · 各 3 副本)
│   ├── Python 算法(普通 Pod · 5 副本)
│   └── Python 数字人渲染(GPU Pool · A10/A100)
├── 中间件
│   ├── MySQL 8(RDS · 主从)
│   ├── Redis Cluster(6 节点 3 主 3 从)
│   ├── Kafka(3 节点集群)
│   ├── Hologres / Flink JobManager
│   └── OSS / CDN
└── 监控 & 安全
    ├── Prometheus + Grafana(指标)
    ├── SLS / ELK(日志)
    ├── Jaeger(Trace)
    └── Sentry(前端错误)
```

## 五、关键质量指标(卷四 §4.5)

| 维度 | 目标 |
|---|---|
| API P95 | ≤ 150ms |
| RTC 端到端延迟 | ≤ 400ms |
| 打断响应 | ≤ 500ms |
| 唇形偏差 | ≤ 80ms |
| 数字人 SLA | ≥ 99.9% |
| 并发班级 | 1,000+ |
| 每节 GPU 成本 | ≤ ¥6(MVP)· ≤ ¥2.8(P0 优化后) |

## 六、变更记录

| 日期 | 变更 | 负责人 |
|---|---|---|
| 2026-04-21 | 初版 · 对齐 W0 技术栈决议 | PM × Claude |
