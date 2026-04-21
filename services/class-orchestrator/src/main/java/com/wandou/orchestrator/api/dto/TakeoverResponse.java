package com.wandou.orchestrator.api.dto;

public record TakeoverResponse(
        String takeoverId,
        long effectiveMs,
        String dtState,
        Breakpoint breakpoint
) {
    public record Breakpoint(String sceneId, long offsetMs) {}
}
