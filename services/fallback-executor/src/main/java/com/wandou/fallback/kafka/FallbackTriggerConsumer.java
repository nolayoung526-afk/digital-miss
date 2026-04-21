package com.wandou.fallback.kafka;

import com.wandou.fallback.domain.FallbackTrigger;
import com.wandou.fallback.service.FallbackExecutor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * 订阅 fallback.triggers topic · 对齐 infra/mq/topics.md
 *
 * 消费规范:
 *   · 幂等:Executor 内部靠 Redis 分布式锁保证单课单预案
 *   · At-least-once:手动 ACK · 失败不提交 · 3 次后入 DLQ
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FallbackTriggerConsumer {

    private final FallbackExecutor executor;

    @KafkaListener(topics = "fallback.triggers",
            groupId = "fallback-executor-v1",
            containerFactory = "manualAckFactory")
    public void onMessage(FallbackTrigger trigger, Acknowledgment ack) {
        try {
            log.info("received trigger · class={} trigger={}",
                    trigger.getClassId(), trigger.getTrigger());
            executor.execute(trigger);
            ack.acknowledge();
        } catch (Exception e) {
            log.error("process fallback trigger failed · {}", trigger, e);
            // 不 ack · Kafka 自动重试
            throw e;
        }
    }
}
