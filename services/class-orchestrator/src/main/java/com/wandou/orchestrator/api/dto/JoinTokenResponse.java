package com.wandou.orchestrator.api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JoinTokenResponse {
    private String appId;
    private String channel;
    private String uid;
    private String token;
    private int ttlSeconds;
    private String role;
}
