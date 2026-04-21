package com.wandou.orchestrator.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 创建课堂请求
 *
 * 参考 PRD 卷三 §3.4 `POST /api/v1/live-class/create`
 */
public record CreateClassRequest(
        @NotBlank String courseId,
        @NotBlank String scriptId,
        @NotBlank String teacherId,
        @NotBlank String assistantId,
        @NotEmpty @Size(min = 1, max = 6) List<String> studentIds,
        @NotNull LocalDateTime startAt,
        @Min(10) Integer durationMin
) {
    public Integer durationMinOrDefault() {
        return durationMin == null ? 40 : durationMin;
    }
}
