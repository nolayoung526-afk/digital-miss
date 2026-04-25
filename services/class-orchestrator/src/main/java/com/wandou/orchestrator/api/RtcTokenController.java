package com.wandou.orchestrator.api;

import com.wandou.orchestrator.api.dto.ApiResponse;
import com.wandou.orchestrator.api.dto.JoinTokenRequest;
import com.wandou.orchestrator.api.dto.JoinTokenResponse;
import com.wandou.orchestrator.service.AgoraTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * RTC Token 签发接口 · 前端启动时拉取动态 Token,替代临时 Token。
 *
 * <p>MVP 阶段把接口放 class-orchestrator 下,后续可迁到独立 auth-service。
 */
@Slf4j
@Tag(name = "RTC", description = "Agora RTC Token 签发")
@RestController
@RequestMapping("/api/v1/rtc")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class RtcTokenController {

    private final AgoraTokenService tokenService;

    @Value("${app.agora.app-id:}")
    private String appId;

    @Operation(summary = "签发课堂 RTC Token")
    @PostMapping("/token")
    public ResponseEntity<ApiResponse<JoinTokenResponse>> issue(@RequestBody @Valid JoinTokenRequest req) {
        AgoraTokenService.AgoraRole role = "audience".equalsIgnoreCase(req.getRole())
                ? AgoraTokenService.AgoraRole.AUDIENCE
                : AgoraTokenService.AgoraRole.BROADCASTER;

        var info = tokenService.issue(req.getChannel(), req.getUid(), role);
        return ResponseEntity.ok(ApiResponse.ok(JoinTokenResponse.builder()
                .appId(appId)
                .channel(req.getChannel())
                .uid(req.getUid())
                .token(info.token())
                .ttlSeconds(info.ttlSeconds())
                .role(req.getRole())
                .build()));
    }
}
