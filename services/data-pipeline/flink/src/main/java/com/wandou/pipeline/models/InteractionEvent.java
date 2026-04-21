package com.wandou.pipeline.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kafka interaction.events 主题的消息结构
 * 与 packages/shared-types InteractionEvent 对齐
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class InteractionEvent {
    private String interactionId;
    private String classId;
    private String studentId;
    private String type;
    private String sceneId;
    private String result;
    private Long latencyMs;
    private String ts;
}
