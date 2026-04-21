package com.wandou.pipeline.functions;

import com.wandou.pipeline.models.InteractionEvent;
import com.wandou.pipeline.models.StudentWindowAgg;
import org.apache.flink.api.common.functions.AggregateFunction;

/**
 * 5 分钟窗口聚合学员互动 · 对齐 PRD 卷五 §5.5
 */
public class InteractionAggregator
        implements AggregateFunction<InteractionEvent, StudentWindowAgg, StudentWindowAgg> {

    @Override
    public StudentWindowAgg createAccumulator() {
        return StudentWindowAgg.builder().build();
    }

    @Override
    public StudentWindowAgg add(InteractionEvent ev, StudentWindowAgg acc) {
        if (acc.getClassId() == null) {
            acc.setClassId(ev.getClassId());
            acc.setStudentId(ev.getStudentId());
        }

        acc.setInteractionCount(acc.getInteractionCount() + 1);

        if (ev.getType() != null) {
            switch (ev.getType()) {
                case "S_ANSWER_VOICE":
                case "S_ANSWER_CHOICE":
                case "S_ANSWER_BOARD":
                    acc.setTotalAnswers(acc.getTotalAnswers() + 1);
                    if ("correct".equals(ev.getResult())) {
                        acc.setCorrectCount(acc.getCorrectCount() + 1);
                    }
                    break;
                case "S_BARGE_IN":
                    acc.setBargeInCount(acc.getBargeInCount() + 1);
                    break;
                default:
                    // ignore other types for aggregation
                    break;
            }
        }
        return acc;
    }

    @Override
    public StudentWindowAgg getResult(StudentWindowAgg acc) {
        return acc;
    }

    @Override
    public StudentWindowAgg merge(StudentWindowAgg a, StudentWindowAgg b) {
        return StudentWindowAgg.builder()
                .classId(a.getClassId())
                .studentId(a.getStudentId())
                .windowStart(Math.min(a.getWindowStart(), b.getWindowStart()))
                .windowEnd(Math.max(a.getWindowEnd(), b.getWindowEnd()))
                .interactionCount(a.getInteractionCount() + b.getInteractionCount())
                .correctCount(a.getCorrectCount() + b.getCorrectCount())
                .totalAnswers(a.getTotalAnswers() + b.getTotalAnswers())
                .speakMs(a.getSpeakMs() + b.getSpeakMs())
                .bargeInCount(a.getBargeInCount() + b.getBargeInCount())
                .build();
    }
}
