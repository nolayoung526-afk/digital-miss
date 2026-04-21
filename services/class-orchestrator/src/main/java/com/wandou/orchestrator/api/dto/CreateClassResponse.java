package com.wandou.orchestrator.api.dto;

import java.time.LocalDateTime;

public record CreateClassResponse(
        String classId,
        String status,
        LocalDateTime warmingAt,
        RtcRoom rtcRoom
) {
    public record RtcRoom(String roomId, int tokenTtlSec) {}
}
