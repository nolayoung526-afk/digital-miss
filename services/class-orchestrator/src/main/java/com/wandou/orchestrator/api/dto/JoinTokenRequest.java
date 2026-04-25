package com.wandou.orchestrator.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinTokenRequest {
    /** 频道名 · 必填 · 与客户端入频道时一致 */
    @NotBlank
    private String channel;

    /** 用户 UID · 必填 · 建议 `stu_xxx` / `as_xxx` / `dt_xxx` 前缀 */
    @NotBlank
    private String uid;

    /** 角色 · host/audience · 默认 host */
    private String role = "host";
}
