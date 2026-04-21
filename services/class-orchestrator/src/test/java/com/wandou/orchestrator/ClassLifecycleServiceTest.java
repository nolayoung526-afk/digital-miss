package com.wandou.orchestrator;

import com.wandou.orchestrator.api.dto.CreateClassRequest;
import com.wandou.orchestrator.api.dto.TakeoverRequest;
import com.wandou.orchestrator.kafka.EventProducer;
import com.wandou.orchestrator.service.ClassLifecycleService;
import com.wandou.orchestrator.service.TakeoverService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * 单元测试 · 仅演示样板
 *
 * 正式 Sprint 1 需补:
 *   · @SpringBootTest + Testcontainers(MySQL/Redis/Kafka)集成测试
 *   · Controller MockMvc 用例 × 6(覆盖 create / get / takeover / 400 / 404 / 409)
 *   · 接管并发测试(并行触发 2 次,验证 Redisson 锁生效)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("课堂编排单测样板")
class ClassLifecycleServiceTest {

    @Mock ClassLifecycleService lifecycleService;

    @Test
    @DisplayName("示例:API 时间戳合法性校验占位")
    void createClassTimestampShouldBeFuture() {
        CreateClassRequest req = new CreateClassRequest(
                "course_1", "script_1", "dt_1", "ast_1",
                List.of("stu_1", "stu_2"),
                LocalDateTime.now().minusDays(1), // 过去时间
                40
        );
        assertNotNull(req);
        // TODO: 接真实 Service 后用 assertThrows(BusinessException.class, () -> service.createClass(req));
    }
}
