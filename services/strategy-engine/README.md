# 策略引擎(Strategy Engine)

> 📅 **启动**:Sprint 2(W3-W4) · 负责人:算法 L2 + 数据 L1
> 🛠 **技术栈**:Python 3.11 + FastAPI + Pydantic + PyYAML + Redis

## 职责

基于 **三层画像**(学员/班级/全平台)执行 **6 条 MVP 规则** + 硬约束裁剪,为每节课下发个性化 **10 旋钮** + **学员变体映射**。

## 🚀 快速启动

```bash
cd services/strategy-engine

# 1. 安装
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# 2. 启动 Redis(若未启)
docker run -d -p 6379:6379 redis:7-alpine

# 3. 启动服务
uvicorn app.main:app --reload --port 8083

# 4. 接口文档
open http://localhost:8083/docs

# 5. 跑测试(验证 6 条规则命中)
pytest -v
```

## 📁 工程结构

```
strategy-engine/
├── pyproject.toml
├── Dockerfile
├── README.md
├── app/
│   ├── main.py                  # FastAPI 入口
│   ├── settings.py              # 环境变量 + 硬约束 + 受保护属性清单
│   ├── models/
│   │   └── schemas.py           # Pydantic:Profile/Knobs/Rule/StrategyConfig
│   ├── rules/
│   │   ├── loader.py            # YAML 扫描 + 合规审查
│   │   ├── evaluator.py         # 条件 DSL 求值(all/any/metric)
│   │   └── engine.py            # 主执行 + 硬约束裁剪
│   ├── services/
│   │   └── profile_store.py     # 画像读写(Redis · 未来对接 Hologres)
│   └── api/
│       ├── strategy_router.py   # /api/v1/strategy/*
│       ├── profile_router.py    # /api/v1/profile/*
│       └── rules_router.py      # /api/v1/rules/*
├── rules/
│   └── mvp_v1.yaml              # 🔥 6 条 MVP 规则
└── tests/
    └── test_engine.py           # 7 条验收用例
```

## 🎯 6 条 MVP 规则

| 规则 ID | 触发条件 | 主要动作 |
|---|---|---|
| R_LOW_PARTICIPATION | avg_interactions < 6 & recent ≥ 3 | K4 补偿 · 红包权重 0.5 |
| R_CONFUSED_HOTSPOT | confused_ratio > 0.25 | K3 降速 · 密板书 · 易难度 |
| R_HIGH_PERFORMER | correct > 0.9 & latency < 1.5s | K1 挑战 · 答题器 60% |
| R_ASR_UNFRIENDLY | asr < 0.7 或 age < 6 | 选择题 70% · 禁口答 |
| R_CLASS_SCATTERED | class.variance > 0.35 | K2 密度 1.2× · 每 3 题激励 |
| R_FREQUENT_BARGE_IN | barge_in/min > 1.5 | 保守阈值 + VAD 提至 -38 |

## 🔒 合规红线

- 受保护属性(gender/ethnicity/region/income_level)**启动时即拒绝加载**包含这些条件的规则
- 硬约束 clamp 保证旋钮不越界(K3 ∈ [0.85, 1.10] · K2 ∈ [0.6, 1.5])
- 冷启动保护 · `recent_classes_count < 3` 的学员自动走 default_profile

## 📬 上下游集成

| 上游 | 提供 |
|---|---|
| data-pipeline | T+1 批跑后写入 `PUT /api/v1/profile/student` |
| class-orchestrator | 开课前 30min `GET /api/v1/strategy/class/{id}/next` |

## ⏭ V2 路线(Sprint 3+)

- Contextual Bandit 模型增强(旋钮自学习)
- BKT 知识掌握推断 · 对接 data-pipeline UDF
- A/B 实验框架接入
- 反事实监控 · 指标下降自动回退 default_profile
