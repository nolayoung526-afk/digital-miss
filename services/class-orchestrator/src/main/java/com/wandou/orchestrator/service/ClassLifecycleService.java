package com.wandou.orchestrator.service;

import com.wandou.orchestrator.api.dto.CreateClassRequest;
import com.wandou.orchestrator.api.dto.CreateClassResponse;
import com.wandou.orchestrator.domain.ClassState;
import com.wandou.orchestrator.domain.LiveClass;
import com.wandou.orchestrator.exception.BusinessException;
import com.wandou.orchestrator.kafka.EventProducer;
import com.wandou.orchestrator.mapper.LiveClassMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * 课堂生命周期服务
 *
 * <p>职责:
 * <ul>
 *   <li>创建课堂(落库 + 签发 Agora Token + 发 lifecycle 事件)</li>
 *   <li>预热 / 开课 / 结课 / 熔断 状态流转</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClassLifecycleService {

    private final LiveClassMapper liveClassMapper;
    private final AgoraTokenService agoraTokenService;
    private final EventProducer eventProducer;

    @Transactional
    public CreateClassResponse createClass(CreateClassRequest req) {
        validate(req);

        String classId = "lc_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        String roomId = "rtc_" + classId;

        LiveClass entity = LiveClass.builder()
                .classId(classId)
                .courseId(req.courseId())
                .scriptId(req.scriptId())
                .teacherId(req.teacherId())
                .assistantId(req.assistantId())
                .studentIds(req.studentIds())
                .startAt(req.startAt())
                .durationMin(req.durationMin())
                .rtcRoomId(roomId)
                .status(ClassState.SCHEDULED)
                .build();

        liveClassMapper.insert(entity);
        log.info("class created · class_id={}", classId);

        // 签发主讲(数字人)Token,学员 Token 在 warming 阶段按需签发
        var dtToken = agoraTokenService.issue(roomId, "dt_" + classId.substring(3, 11),
                AgoraTokenService.AgoraRole.BROADCASTER);

        // 发 class.lifecycle 事件
        eventProducer.publishClassLifecycle(classId, Map.of(
                "event", "class.created",
                "course_id", req.courseId(),
                "teacher_id", req.teacherId(),
                "student_count", req.studentIds().size()
        ));

        return new CreateClassResponse(
                classId,
                ClassState.SCHEDULED.name(),
                req.startAt().minusMinutes(15),
                new CreateClassResponse.RtcRoom(roomId, dtToken.ttlSeconds())
        );
    }

    public LiveClass getByClassId(String classId) {
        var q = new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<LiveClass>()
                .eq("class_id", classId);
        var found = liveClassMapper.selectOne(q);
        if (found == null) {
            throw BusinessException.notFound("class not found: " + classId);
        }
        return found;
    }

    @Transactional
    public void transitionTo(String classId, ClassState next, String reason) {
        LiveClass entity = getByClassId(classId);
        log.info("class transition · class_id={} {} → {} reason={}",
                classId, entity.getStatus(), next, reason);
        entity.setStatus(next);
        if (next == ClassState.ABORTED) {
            entity.setAbortReason(reason);
        }
        if (next == ClassState.ENDED || next == ClassState.ABORTED) {
            entity.setEndedAt(java.time.LocalDateTime.now());
        }
        liveClassMapper.updateById(entity);

        eventProducer.publishClassLifecycle(classId, Map.of(
                "event", "class.state_changed",
                "new_state", next.name(),
                "reason", reason == null ? "" : reason
        ));
    }

    private void validate(CreateClassRequest req) {
        if (req.studentIds() == null || req.studentIds().isEmpty()) {
            throw BusinessException.badRequest("student_ids must not be empty");
        }
        if (req.studentIds().size() > 6) {
            throw BusinessException.badRequest("max 6 students per class");
        }
        if (req.startAt() == null || req.startAt().isBefore(java.time.LocalDateTime.now())) {
            throw BusinessException.badRequest("start_at must be in the future");
        }
    }
}
