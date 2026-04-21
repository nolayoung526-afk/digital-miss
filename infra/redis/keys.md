# Redis Key 命名规范

> 版本 V0.1 · 2026-04-21
> 所有 key 必须先在本文档登记,再进入代码实现。

## 命名原则

- 冒号 `:` 分隔层级(不用下划线 `_` 以免与 ID 冲突)
- 前缀代表业务域,类型明确(`sess` / `cache` / `lock` / `rate` / `queue`)
- **必须设置 TTL**(除永久配置类)
- 生产禁用 `KEYS *`,使用 `SCAN`

## Key 清单

### 1. 会话 & 认证

| Key 模式 | 类型 | TTL | 用途 | Owner |
|---|---|---|---|---|
| `sess:user:{user_id}` | Hash | 7d | 用户会话(JWT 刷新令牌等) | auth-service |
| `sess:assistant:{assistant_id}` | Hash | 12h | 助教在线状态(心跳续期) | class-orchestrator |
| `sess:student:{student_id}:{class_id}` | Hash | 2h | 学员课堂会话 | class-orchestrator |

### 2. RTC & 课堂

| Key 模式 | 类型 | TTL | 用途 |
|---|---|---|---|
| `rtc:token:{class_id}:{uid}` | String | 2h | Agora Token 缓存(签发后复用) |
| `class:state:{class_id}` | Hash | 3h | 课堂状态快照(state / scene / start_at) |
| `class:students:{class_id}` | Set | 3h | 到课学员 ID 集合 |
| `class:dt:breakpoint:{class_id}` | Hash | 3h | 数字人断点(scene_id + char_offset) |

### 3. 策略引擎热缓存

| Key 模式 | 类型 | TTL | 用途 |
|---|---|---|---|
| `strategy:config:{class_id}` | String(JSON) | 4h | 下发的 StrategyConfig 快照 |
| `profile:student:{student_id}` | Hash | 15min | 学员画像热缓存(从 Hologres 回写) |
| `profile:class:{class_id}` | Hash | 15min | 班级画像 |
| `rules:active` | String(JSON) | 30min | 当前生效的规则包(教研审核通过的) |

### 4. FP 预案 & 告警

| Key 模式 | 类型 | TTL | 用途 |
|---|---|---|---|
| `fp:playbook:{playbook_id}` | String(JSON) | 永久 | FP 预案定义缓存 |
| `fp:executing:{class_id}` | Hash | 10min | 当前执行中的 FP(防重入) |
| `alert:dedup:{class_id}:{fp_id}` | String | 5min | 告警去重 |

### 5. 分布式锁(Lettuce + Redisson)

| Key 模式 | TTL | 用途 |
|---|---|---|
| `lock:takeover:{class_id}` | 30s | 助教接管并发控制 |
| `lock:persona:clone:{persona_id}` | 60m | Persona 克隆任务互斥 |
| `lock:script:audit:{script_id}` | 10m | 脚本审核状态修改 |
| `lock:rule:publish:{rule_id}` | 5m | 规则发布 |

**使用规范**:
```java
// 必须使用 Redisson 并设置 leaseTime + waitTime
RLock lock = redisson.getLock("lock:takeover:" + classId);
if (lock.tryLock(3, 30, TimeUnit.SECONDS)) {
    try { ... } finally { lock.unlock(); }
}
```

### 6. 限流(滑动窗口)

| Key 模式 | 窗口 | 阈值 | 用途 |
|---|---|---|---|
| `rate:bargein:{class_id}:{student_id}` | 1min | 6 次 | 打断频率(超触发 FP-05) |
| `rate:api:{user_id}:{endpoint}` | 1s | 20 次 | 通用 API 限流 |
| `rate:asr:{student_id}` | 1min | 30 次 | ASR 调用限流 |
| `rate:llm:report:{class_id}` | 1h | 10 次 | 学情报告 LLM 调用限流 |

### 7. 计数与指标

| Key 模式 | 类型 | TTL | 用途 |
|---|---|---|---|
| `counter:interaction:{class_id}:{student_id}:{day}` | Hash | 7d | 学员每日互动计数(埋点) |
| `metric:dt:uptime:{dt_id}` | String | 1h | 数字人在线时长(秒) |
| `metric:bargein:total:{day}` | HyperLogLog | 30d | 每日独立打断班级数(基数) |

### 8. 队列(小流量用 Redis Stream,大流量走 Kafka)

| Key 模式 | 用途 |
|---|---|
| `queue:notify:parent:{parent_id}` | 家长通知推送队列(低频 · XADD / XREAD) |
| `queue:persona:clone` | Persona 克隆任务(异步 · 30min+ 耗时) |

## Cluster 分片提示

高频 Key 避免使用相同 hash slot 造成热点。建议对 `class_id` 内的多 key 使用 `{}` 强制同槽:

```
class:state:{lc_7a2f}
class:students:{lc_7a2f}
class:dt:breakpoint:{lc_7a2f}
```

这样 MULTI/EXEC 事务可跨 key 操作。

## 禁用 & 规范

- ❌ 禁止 `KEYS *`(生产环境直接报警)
- ❌ 禁止未设 TTL 的 key(配置类除外,需备注)
- ❌ 禁止单 key 过大(String > 1MB · Hash/Set > 100k 元素)
- ✅ 所有 Key 新增需 PR 更新本文档
- ✅ `deleteAll / flushAll` 仅限测试环境,生产需二次确认
