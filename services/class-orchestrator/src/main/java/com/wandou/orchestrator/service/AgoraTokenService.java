package com.wandou.orchestrator.service;

import com.wandou.orchestrator.agora.media.RtcTokenBuilder2;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Agora RTC Token 签发服务。
 *
 * <p>基于 Agora 官方 {@link RtcTokenBuilder2}(AccessToken2 格式,"007" 前缀)
 * 本地签发。仅当 {@code app.agora.app-certificate} 配置后启用真实签名,否则抛出异常,
 * 提示运维在 K8s Secret / 本地 .env.local 中补齐。
 *
 * <p>缓存策略:同 room + uid + role 组合在 TTL-5min 内直接命中 Redis,减少重复签发。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AgoraTokenService {

    private final AgoraProperties props;
    private final StringRedisTemplate redis;
    private final RtcTokenBuilder2 builder = new RtcTokenBuilder2();

    public TokenInfo issue(String roomId, String uid, AgoraRole role) {
        if (props.getAppId() == null || props.getAppId().isBlank()) {
            throw new IllegalStateException("AGORA_APP_ID 未配置 · 设置环境变量 AGORA_APP_ID");
        }
        if (props.getAppCertificate() == null || props.getAppCertificate().isBlank()) {
            throw new IllegalStateException(
                "AGORA_APP_CERTIFICATE 未配置 · 在控制台「主要证书」查看 · 放 K8s Secret / .env.local(gitignored)");
        }

        String cacheKey = "rtc:token:" + roomId + ":" + uid + ":" + role.name();
        String cached = redis.opsForValue().get(cacheKey);
        if (cached != null) {
            log.debug("token cache hit · room={} uid={} role={}", roomId, uid, role);
            return new TokenInfo(cached, props.getTokenTtlSeconds());
        }

        int ttlSec = props.getTokenTtlSeconds();
        RtcTokenBuilder2.Role role2 = role == AgoraRole.BROADCASTER
                ? RtcTokenBuilder2.Role.ROLE_PUBLISHER
                : RtcTokenBuilder2.Role.ROLE_SUBSCRIBER;

        // uid 走 UserAccount 通道 · 兼容前端传字符串("stu_1234" / "dt_class001")
        String token = builder.buildTokenWithUserAccount(
                props.getAppId(),
                props.getAppCertificate(),
                roomId,
                uid,
                role2,
                ttlSec,
                ttlSec);

        long cacheTtl = Math.max(ttlSec - 300, 60);
        redis.opsForValue().set(cacheKey, token, Duration.ofSeconds(cacheTtl));

        log.info("token issued · room={} uid={} role={} ttl={}s", roomId, uid, role, ttlSec);
        return new TokenInfo(token, ttlSec);
    }

    public enum AgoraRole {
        BROADCASTER, AUDIENCE
    }

    public record TokenInfo(String token, int ttlSeconds) {}

    @Data
    @ConfigurationProperties(prefix = "app.agora")
    public static class AgoraProperties {
        private String appId;
        private String appCertificate;
        private int tokenTtlSeconds = 7200;
    }

    @Configuration
    @EnableConfigurationProperties(AgoraProperties.class)
    static class AgoraPropertiesConfig {
    }
}
