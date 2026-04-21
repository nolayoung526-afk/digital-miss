package com.wandou.fallback.service;

import com.wandou.fallback.domain.FPState;
import com.wandou.fallback.domain.FallbackTrigger;
import com.wandou.fallback.domain.Playbook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * FP 三层兜底执行器 · 核心编排逻辑
 *
 * <p>对齐 PRD 卷七 §7.1(阶段 1 · 技术稳定性验证):
 * <pre>
 * 触发 → [查预案] → 加锁 → EXECUTING
 *   ├─ duration 内系统恢复 → RECOVERED
 *   └─ 超时 → ESCALATING → 通知助教
 *        ├─ 30s 内接管 → TAKEN_OVER
 *        └─ 未响应 → ABORTED(补课)
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FallbackExecutor {

    public static final String TOPIC_ALERT = "fallback.alerts";
    private static final String LOCK_PREFIX = "lock:fp:";
    private static final String STATE_PREFIX = "fp:executing:";

    private final PlaybookRegistry registry;
    private final RedissonClient redisson;
    private final KafkaTemplate<String, Object> kafka;

    /**
     * 执行入口(由 Kafka Consumer 调用)
     */
    public void execute(FallbackTrigger trigger) {
        Playbook playbook = registry.findByTrigger(trigger.getTrigger())
                .orElse(null);

        if (playbook == null) {
            log.warn("no playbook matched · trigger={} classId={}",
                    trigger.getTrigger(), trigger.getClassId());
            return;
        }

        String lockKey = LOCK_PREFIX + trigger.getClassId() + ":" + playbook.getPlaybookId();
        RLock lock = redisson.getLock(lockKey);

        try {
            // 单课单预案防重入(R18)
            if (!lock.tryLock(0, playbook.getMaxDurationSec() + 10, TimeUnit.SECONDS)) {
                log.info("same playbook already running · skipping · {}", lockKey);
                return;
            }

            runStateMachine(trigger, playbook);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    private void runStateMachine(FallbackTrigger trigger, Playbook playbook) {
        FPState state = FPState.IDLE;

        // ① 进入 EXECUTING
        state = transition(state, FPState.EXECUTING, trigger, playbook);
        sendDigitalTeacherPrompt(trigger.getClassId(), playbook);
        publishAlert(trigger, playbook, state, "L2 executing");

        // ② 异步等待 maxDurationSec
        CompletableFuture.delayedExecutor(playbook.getMaxDurationSec(), TimeUnit.SECONDS)
                .execute(() -> {
                    // 简化:MVP 阶段假设未恢复 → 升级
                    // 正式实现:订阅恢复事件,若已恢复则短路
                    escalate(trigger, playbook);
                });
    }

    private void escalate(FallbackTrigger trigger, Playbook playbook) {
        FPState state = FPState.ESCALATING;
        publishAlert(trigger, playbook, state, "timeout · escalate to L3");
        log.warn("⚠️ escalating to assistant takeover · class={} playbook={}",
                trigger.getClassId(), playbook.getPlaybookId());

        // 呼叫助教(MVP 先通过 Kafka 发告警 · GA 直接调 orchestrator API)
        kafka.send("takeover.requests", trigger.getClassId(), Map.of(
                "class_id", trigger.getClassId(),
                "reason", "fp_escalation",
                "playbook_id", playbook.getPlaybookId(),
                "severity", playbook.getSeverity()
        ));
    }

    /** 调用 digital-teacher-render 服务让数字人播报预设话术 */
    private void sendDigitalTeacherPrompt(String classId, Playbook playbook) {
        // TODO: HTTP/gRPC 调用 digital-teacher-render
        //       POST /internal/v1/prompts
        //       body: { class_id, scenes: playbook.dt_script, persona_variants }
        log.info("[MOCK] 数字人播报预案 · class={} scenes={}",
                classId, playbook.getDtScript().size());
    }

    private FPState transition(FPState from, FPState to, FallbackTrigger t, Playbook p) {
        log.info("[FSM] class={} playbook={} · {} → {}",
                t.getClassId(), p.getPlaybookId(), from, to);
        return to;
    }

    private void publishAlert(FallbackTrigger trigger, Playbook playbook,
                              FPState state, String msg) {
        Map<String, Object> alert = new HashMap<>();
        alert.put("class_id", trigger.getClassId());
        alert.put("trigger", trigger.getTrigger());
        alert.put("playbook_id", playbook.getPlaybookId());
        alert.put("severity", playbook.getSeverity());
        alert.put("state", state.name());
        alert.put("msg", msg);
        alert.put("ts", java.time.Instant.now().toString());
        kafka.send(TOPIC_ALERT, trigger.getClassId(), alert);
    }
}
