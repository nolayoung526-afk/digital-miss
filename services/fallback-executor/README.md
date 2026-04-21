# FP 预案执行器(Fallback Executor)

> 📅 **启动**:Sprint 1(W1-W2) · 负责人:后端 L2
> 🛠 **技术栈**:Java 21 + Spring Boot 3.3 + Spring State Machine

## 职责

三层兜底模型的 **L2 预案执行层**:

- 订阅 `fallback.triggers` Kafka topic
- 按 `playbook_id` 匹配预案 YAML
- 调用数字人渲染服务播报预设话术
- 监控预案执行时长,超时升级 L3(助教接管)
- 记录全链路日志用于复盘

## 技术栈

同 class-orchestrator · Spring Boot 3.3 栈。

## 预案存储

MVP 阶段 YAML 文件存仓库 + 定时加载;GA 阶段迁移到 MySQL + 教研后台可视化编辑。

```yaml
# resources/playbooks/fp-01-tts-failure.yaml
playbook_id: FP-01
trigger: tts_primary_failure
severity: high
dt_script:
  - scene_id: fp01_sc1
    type: praise
    tts_text: "小朋友们稍等一下下哦~ 豆豆老师喝口水润润嗓子..."
    persona_variants:
      - persona_id: wang_humor
        tts_text: "等豆豆一下下~ 老师刚才讲得太激动,嗓子罢工三秒钟!"
system_action:
  - switch_tts_channel_backup
  - alert_assistant
max_duration_sec: 10
```

## 核心状态机

```
IDLE ─(trigger)─▶ EXECUTING ─(success within timeout)─▶ RECOVERED
                      │
                      └─(timeout)─▶ ESCALATING ─▶ TAKEOVER_REQUESTED
                                                       │
                                             ┌─(assistant 3s 内接管)─▶ TAKEN_OVER
                                             │
                                             └─(30s 无响应)─▶ ABORTED
```

## 12 条预案清单

| ID | 触发 | 最长 | 升级目标 |
|---|---|---|---|
| FP-01 | TTS 主通道失败 | 10s | 助教 |
| FP-02 | 唇形错位 | 30s | 助教 |
| FP-03 | 学员 ASR 连续失败 | 全程 | 降题型 |
| FP-04 | 单学员掉线 | 60s | 补课 |
| FP-05 | 多学员同时发声 | 全程 | SFU 限麦 |
| FP-06 | 课件加载失败 | 120s | 助教 |
| FP-07 | 班级级网络抖动 | 60s | 降码率 |
| FP-08 | 情绪模型异常 | 全程 | 静默关闭 |
| FP-09 | 助教离线 | 30s | 兜底池 |
| FP-10 | 脚本分支未命中 | 即刻 | 教研上报 |
| FP-11 | 数字人口误自检 | 即刻 | 插入纠正 |
| FP-12 | 平台级故障 | 5min | 补课券 |

详见 PRD 卷六 §6.3。
