package com.wandou.pipeline.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentWindowAgg {
    private String classId;
    private String studentId;
    private long windowStart;
    private long windowEnd;
    private int interactionCount;
    private int correctCount;
    private int totalAnswers;
    private long speakMs;
    private int bargeInCount;
}
