# MQ Topic 清单(Kafka 主 · RocketMQ 备选)

> 版本 V0.1 · 2026-04-21
> 默认 Kafka 3.x · 若选 RocketMQ 则 `topic` 对应 `Topic`,`partition` 对应 `queue`

## Topic 命名规范

```
<domain>.<event-type>[.dlq]
```

- `domain`:业务域(`interaction` / `emotion` / `fallback` / `class` / `strategy`)
- `event-type`:事件类型(`events` / `signals` / `triggers`)
- `.dlq` 后缀:死信队列

---

## Topic 清单

### 1. `interaction.events`

| 属性 | 值 |
|---|---|
| **分区数** | 32 |
| **副本** | 3 |
| **保留** | 7 天 |
| **生产者** | interaction-gateway(Java)· 客户端埋点 |
| **消费者** | data-pipeline(Flink)· strategy-engine |
| **Key** | `class_id` · 保证同班有序 |

**Payload Schema**(`InteractionEvent` · 见 shared-types):

```json
{
  "interaction_id": "ev_...",
  "class_id": "lc_20260506_7a2f",
  "student_id": "stu_002",
  "type": "S_ANSWER_VOICE",
  "scene_id": "sc_12",
  "result": "correct",
  "latency_ms": 1340,
  "payload": { "asr_text": "八", "confidence": 0.93 },
  "ts": "2026-05-06T19:12:05.210Z"
}
```

---

### 2. `emotion.signals`

| 属性 | 值 |
|---|---|
| **分区数** | 16 |
| **副本** | 3 |
| **保留** | 3 天(情绪数据合规短保留) |
| **生产者** | 学员客户端(端侧脱敏后) |
| **消费者** | data-pipeline · 助教工作台(SSE 实时) |
| **Key** | `student_id` |

**合规**:原始视频帧 **永不上报**,只传特征向量 + 状态标签。

---

### 3. `fallback.triggers`

| 属性 | 值 |
|---|---|
| **分区数** | 8 |
| **副本** | 3 |
| **保留** | 30 天(复盘必需) |
| **生产者** | class-orchestrator · 监控系统 |
| **消费者** | fallback-executor · 告警服务 · 数据仓库 |
| **Key** | `class_id` |

```json
{
  "class_id": "lc_...",
  "trigger": "tts_primary_failure",
  "severity": "high",
  "context": { "scene_id": "sc_12", "retry_count": 3 },
  "ts": "2026-05-06T19:15:03.500Z"
}
```

---

### 4. `takeover.events`

| 属性 | 值 |
|---|---|
| **分区数** | 8 |
| **副本** | 3 |
| **保留** | 30 天 |
| **生产者** | class-orchestrator |
| **消费者** | 数据仓库 · 告警 · 助教数据看板 |

---

### 5. `strategy.applied`

| 属性 | 值 |
|---|---|
| **分区数** | 8 |
| **副本** | 3 |
| **保留** | 7 天 |
| **生产者** | strategy-engine |
| **消费者** | data-pipeline(反事实监控) |

记录每节课下发的 `StrategyConfig` 快照,用于后验评估策略效果。

---

### 6. `class.lifecycle`

| 属性 | 值 |
|---|---|
| **分区数** | 16 |
| **副本** | 3 |
| **保留** | 90 天(计费 + 审计) |
| **生产者** | class-orchestrator |
| **消费者** | 计费系统 · 数据仓库 |

包含状态迁移事件:`scheduled → warming → live → ended/aborted`。

---

### 7. Death Letter Queues

所有上述 topic 均有对应 DLQ(后缀 `.dlq`),消费失败 3 次进 DLQ,人工介入。

| 源 Topic | DLQ | 告警阈值 |
|---|---|---|
| `interaction.events` | `interaction.events.dlq` | > 100 条/分钟 |
| `fallback.triggers` | `fallback.triggers.dlq` | > 1 条/分钟 ⚠️ |
| `takeover.events` | `takeover.events.dlq` | > 1 条/分钟 ⚠️ |

---

## 生产者规范

### Java(Spring Kafka)

```java
@Component
public class InteractionEventProducer {
    @Autowired private KafkaTemplate<String, InteractionEvent> kafka;

    public void send(InteractionEvent event) {
        // Key = class_id 保证同班分区有序
        kafka.send("interaction.events", event.getClassId(), event)
             .addCallback(
                ok -> log.debug("sent"),
                err -> { log.error("send fail", err); /* 落本地 retry 表 */ }
             );
    }
}
```

### Python(aiokafka · 用于 strategy-engine)

```python
from aiokafka import AIOKafkaProducer

async def publish_strategy(config: StrategyConfig):
    await producer.send_and_wait(
        "strategy.applied",
        key=config.class_id.encode(),
        value=json.dumps(config.__dict__).encode(),
    )
```

---

## 消费者规范

- **幂等**:所有消费者必须幂等(基于 `event_id` 或业务 ID 去重)
- **At-least-once**:消费成功再提交 offset(手动 ACK)
- **消费者组**:`<service-name>.<topic-name>.v1` 命名
- **死信**:连续 3 次失败进 DLQ · 告警

---

## Topic 新增流程

1. 提 PR 更新本文档(必须含 Schema + 分区数 + 保留期 + 生产/消费方)
2. 数据 LD + 基建 LD 双审批
3. 合并后,基建通过 Terraform 创建 topic
4. 生产代码可以开始使用

## 环境区分

| 环境 | 前缀 |
|---|---|
| 开发 | `dev.interaction.events` |
| 测试 | `test.interaction.events` |
| 预发 | `staging.interaction.events` |
| 生产 | `interaction.events`(无前缀) |

---

## 与 RocketMQ 的差异备注(若切换)

| 能力 | Kafka | RocketMQ |
|---|---|---|
| 顺序消息 | 分区内有序 · 跨分区无序 | Topic 级顺序或分区级 |
| 事务消息 | 2.0+ 支持 | 原生支持(更成熟) |
| 延迟消息 | 需插件 | 原生支持 18 级延迟 |
| 吞吐 | 更高 | 略低 |
| 生态 | 配 Flink 最佳 | 阿里系集成好 |

**推荐**:MVP 阶段用 Kafka(数据管道配套),若业务侧需事务/延迟消息再叠加 RocketMQ。
