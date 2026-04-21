package com.wandou.orchestrator.domain;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 直播课堂实体 · 对应 MySQL 表 live_classes
 * 见 infra/mysql/schema.sql
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName(value = "live_classes", autoResultMap = true)
public class LiveClass {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String classId;

    private String courseId;

    private String scriptId;

    private String teacherId;

    private String assistantId;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> studentIds;

    private LocalDateTime startAt;

    private Integer durationMin;

    private String rtcRoomId;

    private ClassState status;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Object strategyConfig;

    private LocalDateTime endedAt;

    private String abortReason;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
