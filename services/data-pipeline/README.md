# 数据管道(Data Pipeline)

> 📅 **启动**:Sprint 2(W3-W4) · 负责人:数据 L1 + 数据 L2
> 🛠 **技术栈**:Flink 1.19(Java) + Spark SQL 3.5 + Hologres

## 🎯 职责

- **实时层**(Flink):订阅 Kafka · 5 min 窗口聚合 · 反事实告警
- **离线层**(Spark SQL):T+1 02:00 跑画像 · BKT 推断
- **存储层**(Hologres):DWD / DWS / ADS 分层

## 📁 代码结构

```
data-pipeline/
├── README.md
├── flink/
│   ├── pom.xml
│   └── src/main/java/com/wandou/pipeline/
│       ├── jobs/
│       │   └── RealtimeAggregatorJob.java    # 🔥 主 Job
│       ├── functions/
│       │   ├── InteractionAggregator.java    # 5min 窗口聚合
│       │   └── AnomalyDetector.java          # 反事实告警
│       └── models/
│           ├── InteractionEvent.java
│           └── StudentWindowAgg.java
└── spark/
    └── scripts/
        ├── dws_student_profile.sql           # 🔥 学员画像
        └── dws_class_profile.sql             # 班级画像
```

## 🚀 Flink 本地运行

```bash
cd services/data-pipeline/flink
mvn clean package

# 提交到 Flink 集群(本地模式)
flink run -c com.wandou.pipeline.jobs.RealtimeAggregatorJob \
  target/data-pipeline-flink.jar
```

或 IDE 直接运行 `RealtimeAggregatorJob.main()`(需配置 Flink 依赖为 compile scope 临时调试)。

## 📊 实时聚合 DAG

```
Kafka: interaction.events
    ↓ deserialize JSON
    ↓ keyBy(class_id + student_id)
    ↓ TumblingEventTimeWindow(5min · lateness=10s)
    ↓ aggregate(InteractionAggregator)
        → StudentWindowAgg {
            correctCount, totalAnswers, bargeInCount, ...
          }
    ↓ keyBy(student_id) + stateful AnomalyDetector
        连续 2 窗口 correct_rate 下降 >10% → 告警
    ↓ Sink: Kafka(counterfactual.alerts) + Hologres(dws_student_profile)
```

## 🌙 Spark T+1 跑批

```bash
# 示例调度(Airflow / DolphinScheduler):
spark-sql \
  --conf spark.sql.hive.metastore.sharedPrefixes=org.postgresql \
  --hiveconf today=$(date -d 'yesterday' +%F) \
  --hiveconf window=30 \
  -f spark/scripts/dws_student_profile.sql
```

## 🎯 SLA

| 指标 | 目标 |
|---|---|
| ODS 入库延迟 | P95 ≤ 30s |
| DWS 批跑完成 | 每日 04:00 前 |
| 画像字段完整率 | ≥ 98% |
| 实时 vs T+1 一致性 | 差异 ≤ 5% |

## ⏭ Sprint 2 补齐

- [ ] Hologres JDBC Sink(真实写库)
- [ ] BKT UDF 实现(pyspark + 状态迭代)
- [ ] Airflow DAG(或公司现有调度系统)
- [ ] 数据质量断言(Great Expectations)
- [ ] 端到端 E2E 测试(往 Kafka 写 → 查 Hologres)
