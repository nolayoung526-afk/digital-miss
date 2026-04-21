-- ============================================================
-- 班级画像 T+1
-- 对齐 PRD 卷五:profile_variance / avg_focus / low_participation_ratio
-- ============================================================

INSERT OVERWRITE TABLE dws_class_profile PARTITION (ds='${today}')
SELECT
    class_id,

    -- 班级情绪均值
    avg(confused_ratio)                             AS avg_confused,
    avg(focus_ratio)                                AS avg_focus,

    -- 班内学员方差(核心指标 · R_CLASS_SCATTERED)
    stddev_pop(correct_rate) / NULLIF(avg(correct_rate), 0)
                                                   AS profile_variance,

    -- 低参与学员占比
    SUM(IF(avg_interactions < 6, 1, 0)) * 1.0 / COUNT(*)
                                                   AS low_participation_ratio,

    -- 难点聚集(> 50% 错误率的知识点)
    collect_list(IF(
        (correct_answers * 1.0 / total_answers) < 0.5,
        knowledge_point,
        NULL
    ))                                             AS difficult_knowledge_points,

    current_timestamp()                             AS updated_at

FROM dws_student_profile sp
JOIN dim_student_class sc ON sp.student_id = sc.student_id
WHERE sp.ds = '${today}'
GROUP BY class_id
;
