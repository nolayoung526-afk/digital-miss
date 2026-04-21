package com.wandou.fallback.api;

import com.wandou.fallback.domain.FallbackTrigger;
import com.wandou.fallback.domain.Playbook;
import com.wandou.fallback.service.FallbackExecutor;
import com.wandou.fallback.service.PlaybookRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 运维接口 · 便于手动触发 / 查看预案
 */
@Tag(name = "Fallback", description = "FP 预案执行与管理")
@RestController
@RequestMapping("/api/v1/fallback")
@RequiredArgsConstructor
public class FallbackController {

    private final FallbackExecutor executor;
    private final PlaybookRegistry registry;

    @Operation(summary = "手动触发 FP(运维 / 测试用)")
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> trigger(@RequestBody FallbackTrigger req) {
        executor.execute(req);
        return ResponseEntity.ok(Map.of("accepted", true, "class_id", req.getClassId()));
    }

    @Operation(summary = "列出已加载预案")
    @GetMapping("/playbooks")
    public ResponseEntity<Map<String, Playbook>> list() {
        return ResponseEntity.ok(registry.all());
    }

    @Operation(summary = "查询单个预案")
    @GetMapping("/playbooks/{trigger}")
    public ResponseEntity<?> get(@PathVariable String trigger) {
        return registry.findByTrigger(trigger)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
