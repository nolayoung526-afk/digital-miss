package com.wandou.assetmgr.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ClonePersonaRequest {
    @NotBlank
    private String realTeacherId;
    @NotBlank
    private String displayName;
    /** 照片 OSS URL(必填 · 1024×1024) */
    @NotBlank
    private String photoOssUrl;
    /** 音频样本 OSS URL(10 句拼合或分片上传后由后端合并) */
    @NotBlank
    private String voiceSampleOssUrl;
    /** 肖像 + 声音授权书 OSS URL */
    @NotBlank
    private String licenseDocUrl;
    /** 授权有效期 */
    @NotBlank
    private String licenseValidUntil;

    public LocalDate licenseValidUntilAsDate() {
        return LocalDate.parse(licenseValidUntil);
    }
}
