package com.wandou.fallback.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * FP 预案定义 · 对应 YAML 文件 resources/playbooks/fp-xx.yaml
 * 与 PRD 卷三 §3.1 FallbackPlaybook 字段对齐
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Playbook {
    private String playbookId;           // FP-01 ~ FP-12
    private String trigger;              // tts_primary_failure / multi_speak / ...
    private String severity;             // low / mid / high
    private List<Scene> dtScript;        // 数字人分镜
    private List<String> systemAction;   // 系统动作
    private Integer maxDurationSec;
    private String escalateTo;           // assistant / abort
    private String version;
    private String auditStatus;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Scene {
        private String sceneId;
        private String type;
        private String ttsText;
        private Map<String, String> personaVariants;  // persona_id → tts_text
        private String emotion;
        private String gesture;
    }
}
