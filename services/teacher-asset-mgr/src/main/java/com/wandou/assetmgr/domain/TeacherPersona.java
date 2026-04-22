package com.wandou.assetmgr.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("teacher_personas")
public class TeacherPersona {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String personaId;
    private String realTeacherId;
    private String displayName;
    private String avatarAssetId;
    private String voiceProfileId;
    private String licenseDocUrl;
    private LocalDate licenseValidUntil;
    private String status;
    private String stylePreset;
    private String renderVendor;
    private String vendorAvatarId;
    private String ttsVendor;
    private String vendorVoiceId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @TableLogic
    private LocalDateTime deletedAt;
}
