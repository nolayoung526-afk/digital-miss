-- ============================================================
-- 豌豆思维数字人老师 · MySQL 初始 Schema
-- 版本: V0.1 · 2026-04-21
-- 引擎: InnoDB · 字符集: utf8mb4_0900_ai_ci
-- 约定:
--   · 所有表含 created_at / updated_at
--   · 软删除用 deleted_at,不物理删除
--   · 枚举用 VARCHAR 存储,代码层做约束
--   · JSON 字段存复杂结构(如 lip_keyframes)
-- ============================================================

-- 开启严格模式
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. teacher_personas · 数字人 Persona(PRD 卷三 §3.1)
-- ============================================================
CREATE TABLE IF NOT EXISTS `teacher_personas` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `persona_id`          VARCHAR(36) NOT NULL COMMENT '业务 ID,UUID',
  `real_teacher_id`     VARCHAR(64) NOT NULL COMMENT '对应员工 ID',
  `display_name`        VARCHAR(32) NOT NULL,
  `avatar_asset_id`     VARCHAR(64) NOT NULL,
  `voice_profile_id`    VARCHAR(64) NOT NULL,
  `license_doc_url`     VARCHAR(512) NOT NULL COMMENT '授权书 OSS 地址',
  `license_valid_until` DATE NOT NULL COMMENT '授权有效期',
  `status`              VARCHAR(16) NOT NULL DEFAULT 'collecting'
                        COMMENT 'collecting/modeling/reviewing/approved/suspended/revoked',
  `style_preset`        VARCHAR(16) NOT NULL DEFAULT 'cartoon_2d',
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`          TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_persona_id` (`persona_id`),
  KEY `idx_real_teacher` (`real_teacher_id`),
  KEY `idx_status` (`status`, `license_valid_until`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数字人 Persona 资产';

-- ============================================================
-- 2. scripts · 教研脚本
-- ============================================================
CREATE TABLE IF NOT EXISTS `scripts` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `script_id`     VARCHAR(36) NOT NULL,
  `course_id`     VARCHAR(64) NOT NULL,
  `version`       VARCHAR(16) NOT NULL COMMENT '语义化版本 v1.2.0',
  `audit_status`  VARCHAR(16) NOT NULL DEFAULT 'draft'
                  COMMENT 'draft/reviewing/approved/offline',
  `author_id`     VARCHAR(64) NOT NULL,
  `reviewers`     JSON COMMENT '审核链路记录',
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`    TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_script_id` (`script_id`),
  KEY `idx_course` (`course_id`, `version`),
  KEY `idx_status` (`audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教研脚本主表';

-- ============================================================
-- 3. scenes · 分镜
-- ============================================================
CREATE TABLE IF NOT EXISTS `scenes` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `scene_id`         VARCHAR(36) NOT NULL,
  `script_id`        VARCHAR(36) NOT NULL,
  `seq_no`           INT NOT NULL COMMENT '分镜在脚本中的顺序',
  `type`             VARCHAR(16) NOT NULL COMMENT 'intro/teach/quiz/praise/summary',
  `tts_text`         VARCHAR(2000) NOT NULL,
  `lip_keyframes`    JSON COMMENT '唇形关键帧数组',
  `board_actions`    JSON COMMENT '板书指令数组',
  `branches`         JSON COMMENT '应答分支',
  `variants`         JSON COMMENT '学员画像变体',
  `interaction`      JSON COMMENT '互动配置(类型/超时/奖励)',
  `pacing`           JSON COMMENT 'pacing 配置(speed/timeout)',
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scene_id` (`scene_id`),
  KEY `idx_script` (`script_id`, `seq_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分镜表';

-- ============================================================
-- 4. live_classes · 课堂实例
-- ============================================================
CREATE TABLE IF NOT EXISTS `live_classes` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id`        VARCHAR(36) NOT NULL,
  `course_id`       VARCHAR(64) NOT NULL,
  `script_id`       VARCHAR(36) NOT NULL,
  `teacher_id`      VARCHAR(36) NOT NULL COMMENT 'persona_id',
  `assistant_id`    VARCHAR(64) NOT NULL,
  `student_ids`     JSON NOT NULL COMMENT '学员 ID 数组 4-6 人',
  `start_at`        DATETIME NOT NULL,
  `duration_min`    INT NOT NULL DEFAULT 40,
  `rtc_room_id`     VARCHAR(64) NOT NULL,
  `status`          VARCHAR(16) NOT NULL DEFAULT 'scheduled'
                    COMMENT 'scheduled/warming/live/ended/aborted',
  `strategy_config` JSON COMMENT '下发的 StrategyConfig 快照',
  `ended_at`        DATETIME NULL,
  `abort_reason`    VARCHAR(128) NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_class_id` (`class_id`),
  KEY `idx_start_status` (`start_at`, `status`),
  KEY `idx_teacher` (`teacher_id`),
  KEY `idx_assistant` (`assistant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='直播课堂';

-- ============================================================
-- 5. students · 学员档案(最小集,详细画像在 Hologres)
-- ============================================================
CREATE TABLE IF NOT EXISTS `students` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id`  VARCHAR(64) NOT NULL,
  `nickname`    VARCHAR(32) NOT NULL,
  `age`         TINYINT UNSIGNED,
  `grade`       TINYINT UNSIGNED COMMENT '1-6',
  `parent_id`   VARCHAR(64) COMMENT '家长账号',
  `consent_at`  DATETIME COMMENT '情绪/摄像头授权时间',
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_id` (`student_id`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_grade` (`grade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学员档案';

-- ============================================================
-- 6. assistants · 助教
-- ============================================================
CREATE TABLE IF NOT EXISTS `assistants` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `assistant_id`    VARCHAR(64) NOT NULL,
  `name`            VARCHAR(32) NOT NULL,
  `is_active`       TINYINT NOT NULL DEFAULT 1,
  `max_parallel`    TINYINT NOT NULL DEFAULT 3 COMMENT '可同时陪跑班级数',
  `is_fallback_pool` TINYINT NOT NULL DEFAULT 0 COMMENT '是否加入兜底池',
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_assistant_id` (`assistant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='助教';

-- ============================================================
-- 7. fallback_playbooks · FP 预案
-- ============================================================
CREATE TABLE IF NOT EXISTS `fallback_playbooks` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `playbook_id`       VARCHAR(16) NOT NULL COMMENT 'FP-01 ~ FP-12',
  `trigger`           VARCHAR(64) NOT NULL,
  `severity`          VARCHAR(8) NOT NULL COMMENT 'low/mid/high',
  `dt_script`         JSON NOT NULL COMMENT '预案分镜数组',
  `system_action`     JSON NOT NULL,
  `max_duration_sec`  INT NOT NULL,
  `notify`            JSON,
  `version`           VARCHAR(16) NOT NULL,
  `audit_status`      VARCHAR(16) NOT NULL DEFAULT 'draft',
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_playbook_trigger` (`trigger`, `version`),
  KEY `idx_status` (`audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='FP 预案库';

-- ============================================================
-- 8. strategy_rules · 策略规则(卷五 §5.3)
-- ============================================================
CREATE TABLE IF NOT EXISTS `strategy_rules` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rule_id`        VARCHAR(64) NOT NULL COMMENT 'R_LOW_PARTICIPATION 等',
  `name`           VARCHAR(128) NOT NULL,
  `priority`       INT NOT NULL DEFAULT 100,
  `scope`          VARCHAR(16) NOT NULL DEFAULT 'student' COMMENT 'student/class',
  `when_expr`      JSON NOT NULL COMMENT '触发条件 DSL',
  `then_expr`      JSON NOT NULL COMMENT '旋钮调整',
  `rationale`      VARCHAR(512) COMMENT '规则依据',
  `safety`         JSON COMMENT '恢复 / 最大连续命中 等',
  `audit_status`   VARCHAR(16) NOT NULL DEFAULT 'draft',
  `rollout_pct`    INT NOT NULL DEFAULT 0 COMMENT '灰度百分比',
  `author_id`      VARCHAR(64) NOT NULL,
  `reviewers`      JSON,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`     TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rule_id` (`rule_id`),
  KEY `idx_status_rollout` (`audit_status`, `rollout_pct`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='策略规则';

-- ============================================================
-- 9. audit_logs · 审计日志(合规留痕)
-- ============================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(32) NOT NULL COMMENT 'script/persona/rule/playbook',
  `entity_id`   VARCHAR(64) NOT NULL,
  `action`      VARCHAR(32) NOT NULL COMMENT 'submit/approve/reject/publish',
  `actor_id`    VARCHAR(64) NOT NULL,
  `actor_role`  VARCHAR(32) NOT NULL,
  `before`      JSON,
  `after`       JSON,
  `comment`     VARCHAR(512),
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entity` (`entity_type`, `entity_id`),
  KEY `idx_actor` (`actor_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志(合规 ≥ 3 年)';

-- ============================================================
-- 10. takeover_events · 接管事件(便于运营复盘)
-- ============================================================
CREATE TABLE IF NOT EXISTS `takeover_events` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `class_id`       VARCHAR(36) NOT NULL,
  `assistant_id`   VARCHAR(64) NOT NULL,
  `reason`         VARCHAR(64) NOT NULL,
  `triggered_at`   DATETIME(3) NOT NULL,
  `effective_ms`   INT COMMENT '生效延迟',
  `returned_at`    DATETIME(3),
  `breakpoint`     JSON COMMENT 'scene_id + offset',
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_class` (`class_id`, `triggered_at`),
  KEY `idx_assistant` (`assistant_id`, `triggered_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='助教接管事件';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 未来扩展(GA 阶段按需创建):
--   · classroom_sessions · 课堂会话明细
--   · interaction_events_archive · 互动事件归档(主要入 Kafka + Hologres)
--   · emotion_signals_archive · 情绪信号归档
--   · reports · 学情报告缓存
-- ============================================================
