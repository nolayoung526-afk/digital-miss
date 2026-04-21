package com.wandou.fallback.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * FP 触发事件(来自 Kafka fallback.triggers)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FallbackTrigger {
    private String classId;
    private String trigger;        // tts_primary_failure 等
    private String severity;
    private Object context;        // 任意上下文 JSON
    private String ts;
}
