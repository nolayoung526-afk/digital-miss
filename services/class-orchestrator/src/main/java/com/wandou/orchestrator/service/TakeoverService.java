package com.wandou.orchestrator.service;

import com.wandou.orchestrator.api.dto.TakeoverRequest;
import com.wandou.orchestrator.api.dto.TakeoverResponse;
import com.wandou.orchestrator.domain.ClassState;
import com.wandou.orchestrator.domain.LiveClass;
import com.wandou.orchestrator.exception.BusinessException;
import com.wandou.orchestrator.kafka.EventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 助教接管服务
 *
 * <p>PRD 卷二 §2.4 模块 D:
 * <ol>
 *   <li>Redisson 分布式锁防并发(同一课堂只能 1 个助教接管)</li>
 *   <li>校验课堂状态(warming / live 才能接管)</li>
 *   <li>记录断点 (TODO: 从渲染服务拉取 current_scene + offset)</li>
 *   <li>发 takeover.events 事件 · 后续 fallback-executor 订阅</li>
 * </ol>
 * <p>目标:一键接管生效 ≤ 3 秒(卷四 §4.5)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TakeoverService {

    private final RedissonClient redisson;
    private final ClassLifecycleService classLifecycleService;
    private final EventProducer eventProducer;

    @Value("${app.takeover.lock-wait-seconds:3}")
    private int lockWaitSec;

    @Value("${app.takeover.lock-lease-seconds:30}")
    private int lockLeaseSec;

    public TakeoverResponse takeover(String classId, TakeoverRequest req) {
        long startNanos = System.nanoTime();
        String lockKey = "lock:takeover:" + classId;
        RLock lock = redisson.getLock(lockKey);

        try {
            if (!lock.tryLock(lockWaitSec, lockLeaseSec, TimeUnit.SECONDS)) {
                throw BusinessException.conflict("另一位助教正在接管,请稍候");
            }

            LiveClass clazz = classLifecycleService.getByClassId(classId);
            if (!clazz.getStatus().canTakeover()) {
                throw BusinessException.badRequest(
                        "class status [" + clazz.getStatus() + "] cannot be taken over");
            }

            // TODO: 向 digital-teacher-render 发起 gRPC/HTTP 调用,
            //       让数字人立即 fade_out + 切 listening + 返回当前断点
            //       此处先 Mock
            TakeoverResponse.Breakpoint breakpoint = new TakeoverResponse.Breakpoint(
                    "sc_current_mock", 3500L);

            String takeoverId = "tk_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            long effectiveMs = (System.nanoTime() - startNanos) / 1_000_000;

            // 发 Kafka 事件
            eventProducer.publishTakeover(classId, Map.of(
                    "takeover_id", takeoverId,
                    "class_id", classId,
                    "assistant_id", req.assistantId(),
                    "reason", req.reason(),
                    "effective_ms", effectiveMs,
                    "breakpoint", breakpoint
            ));

            log.info("takeover ok · class_id={} assistant={} reason={} effective={}ms",
                    classId, req.assistantId(), req.reason(), effectiveMs);

            return new TakeoverResponse(takeoverId, effectiveMs, "paused", breakpoint);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw BusinessException.internal("takeover interrupted");
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
