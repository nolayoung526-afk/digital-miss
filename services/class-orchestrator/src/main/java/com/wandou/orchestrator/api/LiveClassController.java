package com.wandou.orchestrator.api;

import com.wandou.orchestrator.api.dto.*;
import com.wandou.orchestrator.domain.LiveClass;
import com.wandou.orchestrator.service.ClassLifecycleService;
import com.wandou.orchestrator.service.TakeoverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 课堂编排核心 Controller · 对齐 PRD 卷三 §3.4
 */
@Slf4j
@Tag(name = "LiveClass", description = "直播课堂生命周期 + 接管")
@RestController
@RequestMapping("/api/v1/live-class")
@RequiredArgsConstructor
public class LiveClassController {

    private final ClassLifecycleService lifecycleService;
    private final TakeoverService takeoverService;

    @Operation(summary = "创建课堂 · 签发 Agora Token")
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<CreateClassResponse>> create(
            @RequestBody @Valid CreateClassRequest req) {
        var result = lifecycleService.createClass(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @Operation(summary = "查询课堂")
    @GetMapping("/{classId}")
    public ResponseEntity<ApiResponse<LiveClass>> get(@PathVariable String classId) {
        return ResponseEntity.ok(ApiResponse.ok(lifecycleService.getByClassId(classId)));
    }

    @Operation(summary = "助教一键接管 · 目标 ≤ 3s 生效")
    @PostMapping("/{classId}/takeover")
    public ResponseEntity<ApiResponse<TakeoverResponse>> takeover(
            @PathVariable String classId,
            @RequestBody @Valid TakeoverRequest req) {
        var result = takeoverService.takeover(classId, req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
