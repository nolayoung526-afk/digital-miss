package com.wandou.assetmgr.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PersonaResponse {
    private String personaId;
    private String realTeacherId;
    private String displayName;
    private String status;
    private String renderVendor;
    private String vendorAvatarId;
    private String ttsVendor;
    private String vendorVoiceId;
    private String licenseValidUntil;
}
