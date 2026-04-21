package com.wandou.orchestrator.api.dto;

import jakarta.validation.constraints.NotBlank;

public record TakeoverRequest(
        @NotBlank String assistantId,
        @NotBlank String reason
) {}
