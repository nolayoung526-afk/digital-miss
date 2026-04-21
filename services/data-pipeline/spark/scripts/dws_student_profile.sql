-- ============================================================
-- 豌豆思维数字人 · 学员画像 T+1 聚合(Spark SQL)
-- 每日 02:00 跑批 · 近 30 天数据聚合近 5 节课
-- 对齐 PRD 卷五 §5.5
-- ============================================================

-- 参数:
--   ${today}     运行日(yyyy-MM-dd)
--   ${window}    回看天数(默认 30)

INSERT OVERWRITE TABLE dws_student_profile PARTITION (ds='${today}')
SELECT
    student_id,

    -- ============ 基础 ============
    max(age)                                      AS age,
    max(grade)                                    AS grade,

    -- ============ 参与度(EMA 平滑) ============
    -- PySpark UDF ema(values, alpha) 在初始化时注册
    ema(collect_list(avg_interactions), 0.3)       AS avg_interactions_per_class,
    ema(collect_list(speak_ratio), 0.3)            AS speak_ratio,

    -- ============ 应答质量 ============
    SUM(correct_answers) * 1.0 / NULLIF(SUM(total_answers), 0)
                                                   AS correct_rate,
    percentile_approx(answer_latency_ms, 0.5)      AS median_latency_ms,
    avg(answer_latency_ms)                         AS avg_answer_latency_ms,

    -- ============ 情绪(剔除低置信) ============
    SUM(
        IF(emotion = 'confused' AND emotion_confidence >= 0.7, duration_ms, 0)
    ) * 1.0 / NULLIF(SUM(duration_ms), 0)         AS confused_ratio,

    SUM(
        IF(emotion = 'focus' AND emotion_confidence >= 0.7, duration_ms, 0)
    ) * 1.0 / NULLIF(SUM(duration_ms), 0)         AS focus_ratio,

    -- ============ ASR 成功率 ============
    SUM(IF(asr_ok, 1, 0)) * 1.0 / NULLIF(SUM(asr_attempts), 0)
                                                   AS asr_success_rate,

    -- ============ 打断频率 ============
    avg(barge_in_per_min)                          AS barge_in_per_min,

    -- ============ 激励敏感度 ============
    -- happy 峰值前 5s 内归因的奖励事件 Top 3
    top_k_attribution('happy_peak_reward', 3)      AS happy_triggers,

    -- ============ 知识点掌握(BKT 推断 · UDF) ============
    bkt_infer(collect_list(named_struct(
        'knowledge_point', knowledge_point,
        'correct', correct_answers,
        'total', total_answers
    )))                                            AS knowledge_mastery,

    -- ============ 冷启动标记 ============
    COUNT(DISTINCT class_id)                       AS recent_classes_count,

    current_timestamp()                            AS updated_at

FROM dwd_student_class_behavior
WHERE ds BETWEEN date_sub('${today}', ${window}) AND date_sub('${today}', 1)
GROUP BY student_id
HAVING COUNT(DISTINCT class_id) >= 3   -- 冷启动过滤:< 3 节课不入 DWS
;
