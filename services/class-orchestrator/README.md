# 课堂编排服务(Class Orchestrator)

> 📅 **启动**:Sprint 1(W1-W2) · 负责人:后端 L1
> 🛠 **技术栈**:Java 21 + Spring Boot 3.3

## 职责

课堂生命周期的 **编排中枢**:

- **调度**:排课 → 开课前 30min 拉策略 → 15min 预热 → 整点开课
- **信令**:声网 Stream Message 路由(举手 / 接管 / 打断 / FP 事件)
- **状态机**:维护 `scheduled → warming → live → ended/aborted`
- **接口**:对接教研(脚本)/ 策略引擎(画像)/ 渲染服务(推流)/ Kafka(埋点)

## 技术栈

| 项 | 选型 |
|---|---|
| 语言 | Java 21(Virtual Threads 用于 WebSocket 密集) |
| 框架 | Spring Boot 3.3 · Spring WebFlux · Spring State Machine |
| ORM | MyBatis-Plus(简单)· JOOQ(复杂 SQL) |
| DB | MySQL 8(InnoDB) |
| 缓存 | Redis 7 Cluster(Lettuce Client) |
| MQ | Kafka 3.x(Spring Kafka) |
| Agora | Agora Server SDK for Java |
| Config | Nacos / Apollo |
| 监控 | Micrometer + Prometheus + OTel + Jaeger |
| 测试 | JUnit 5 · Mockito · Testcontainers(集成) |

## 关键接口(摘自 PRD 卷三 §3.4)

```
POST /api/v1/live-class/create           创建课堂
POST /api/v1/live-class/{id}/warm        预热开课
POST /api/v1/live-class/{id}/takeover    助教接管
POST /api/v1/live-class/{id}/resume      接管交还
POST /api/v1/live-class/{id}/bargein     打断事件上报
POST /api/v1/fallback/trigger            FP 触发
GET  /api/v1/strategy/class/{id}/next    拉取下节策略
```

## 工程骨架(W1 生成)

```
class-orchestrator/
├── pom.xml                          # Maven / 或 build.gradle.kts
├── src/main/java/com/wandou/orchestrator/
│   ├── OrchestratorApplication.java
│   ├── api/                         # Controller
│   │   ├── LiveClassController.java
│   │   ├── TakeoverController.java
│   │   └── FallbackController.java
│   ├── service/                     # 业务逻辑
│   │   ├── ClassLifecycleService.java
│   │   ├── TakeoverService.java
│   │   └── SignalingService.java
│   ├── domain/                      # Entity + VO
│   ├── mapper/                      # MyBatis-Plus
│   ├── statemachine/                # Spring State Machine 配置
│   ├── kafka/                       # Producer / Listener
│   ├── agora/                       # Agora SDK 封装
│   └── config/
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── mapper/*.xml
└── src/test/                        # JUnit + Testcontainers
```

## 状态机(Spring State Machine)

```java
@Configuration
@EnableStateMachine
public class ClassStateConfig extends EnumStateMachineConfigurerAdapter<ClassState, ClassEvent> {

    public enum ClassState  { SCHEDULED, WARMING, LIVE, ENDED, ABORTED }
    public enum ClassEvent  { WARM, START, END, ABORT }

    @Override
    public void configure(StateMachineTransitionConfigurer<ClassState, ClassEvent> transitions) throws Exception {
        transitions
            .withExternal().source(SCHEDULED).target(WARMING).event(WARM)
            .and()
            .withExternal().source(WARMING).target(LIVE).event(START)
            .and()
            .withExternal().source(LIVE).target(ENDED).event(END)
            .and()
            .withExternal().source(LIVE).target(ABORTED).event(ABORT);
    }
}
```

## 🚀 快速启动(本地)

### 1. 启动依赖(MySQL + Redis + Kafka)

```bash
cd services/class-orchestrator
docker-compose -f docker-compose.dev.yml up -d

# 检查
docker ps            # 应看到 dt-mysql / dt-redis / dt-kafka 三个容器
open http://localhost:8088   # Kafka UI
```

### 2. 启动应用

```bash
# 需要 JDK 21 + Maven 3.9+
mvn spring-boot:run

# 或 Docker 方式
docker build -t class-orchestrator:0.1.0 .
docker run -p 8081:8081 --network host class-orchestrator:0.1.0
```

### 3. 验证接口

```bash
# 健康检查
curl http://localhost:8081/actuator/health

# 创建课堂
curl -X POST http://localhost:8081/api/v1/live-class/create \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "MATH_L2_U03_C05",
    "scriptId": "script_demo",
    "teacherId": "dt_doudou_01",
    "assistantId": "ast_zhao",
    "studentIds": ["stu_001","stu_002","stu_003","stu_004"],
    "startAt": "2026-12-31T19:00:00",
    "durationMin": 40
  }'

# 一键接管
curl -X POST http://localhost:8081/api/v1/live-class/{class_id}/takeover \
  -H "Content-Type: application/json" \
  -d '{"assistantId": "ast_zhao", "reason": "dt_script_error"}'

# Swagger UI
open http://localhost:8081/swagger-ui.html
```

## 🏗 代码结构

```
class-orchestrator/
├── pom.xml
├── Dockerfile
├── docker-compose.dev.yml        # 本地依赖栈(MySQL/Redis/Kafka)
├── src/main/java/com/wandou/orchestrator/
│   ├── OrchestratorApplication.java
│   ├── api/
│   │   ├── LiveClassController.java
│   │   └── dto/                  # ApiResponse / CreateClass / Takeover
│   ├── service/
│   │   ├── ClassLifecycleService.java
│   │   ├── TakeoverService.java  # Redisson 锁 + 3s 生效目标
│   │   └── AgoraTokenService.java # Mock Token(可替换真 SDK)
│   ├── domain/                   # LiveClass + ClassState + ClassEvent
│   ├── mapper/                   # MyBatis-Plus BaseMapper
│   ├── kafka/                    # EventProducer(3 个 topic)
│   ├── statemachine/             # Spring State Machine 配置
│   ├── config/                   # MyBatis / Jackson / OpenAPI / MetaFill
│   └── exception/                # BusinessException + GlobalHandler
├── src/main/resources/
│   ├── application.yml           # MySQL/Redis/Kafka/Actuator 全配
│   └── application-dev.yml
└── src/test/java/...
    └── ClassLifecycleServiceTest.java   # 样板
```

## 📡 实现清单

| 状态 | 能力 | 文件 |
|---|---|---|
| ✅ | POST /live-class/create | LiveClassController · ClassLifecycleService |
| ✅ | GET /live-class/{id} | 同上 |
| ✅ | POST /live-class/{id}/takeover | TakeoverService(Redisson 锁) |
| ✅ | Agora Token 签发 + Redis 缓存 | AgoraTokenService(Mock) |
| ✅ | class.lifecycle + takeover.events Kafka 生产 | EventProducer |
| ✅ | 课堂状态机定义 | ClassStateMachineConfig |
| ✅ | MyBatis-Plus 自动填充 createdAt/updatedAt | MetaObjectHandlerImpl |
| ⏳ | 正式 Agora AccessToken2 接入 | Sprint 1 |
| ⏳ | Testcontainers 集成测试 | Sprint 1 |
| ⏳ | `/warm` `/resume` 接口 + 状态机集成 | Sprint 1 |
| ⏳ | `/bargein/event` 接口 | Sprint 2 |
| ⏳ | Digital-teacher-render gRPC 调用 | Sprint 2 |

## 🎯 下一步(Sprint 1 Day 1 计划)

1. 把 schema.sql 用 Flyway 接起来
2. 补 `warm` / `end` / `abort` 接口 · 与 State Machine 绑定
3. Testcontainers 跑一遍 MySQL + Redis + Kafka 集成
4. 对接 digital-teacher-render 的断点拉取接口(替换 TakeoverService 里的 Mock Breakpoint)

- API P95 ≤ 150ms(接管 / 策略获取等高频接口)
- 单集群承载 ≥ 1,000 并发班级
- SLA ≥ 99.9%
- 一键接管生效 ≤ 3s
