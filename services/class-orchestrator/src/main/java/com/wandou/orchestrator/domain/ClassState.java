package com.wandou.orchestrator.domain;

/**
 * 课堂状态枚举(卷三 §3.2 状态机)
 * <pre>
 * scheduled ──(warmup 15min)──▶ warming ──(开课)──▶ live
 *                                                  │
 *                                       ┌──────────┤
 *                                       │(正常)    │(熔断/接管失败)
 *                                       ▼          ▼
 *                                     ended      aborted
 * </pre>
 */
public enum ClassState {
    SCHEDULED,
    WARMING,
    LIVE,
    ENDED,
    ABORTED;

    public boolean canTakeover() {
        return this == WARMING || this == LIVE;
    }
}
