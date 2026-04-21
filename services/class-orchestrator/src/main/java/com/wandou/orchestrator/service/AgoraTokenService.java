package com.wandou.orchestrator.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

/**
 * Agora Token 签发服务
 *
 * <p><b>MVP 阶段使用 Mock 实现</b>:生成一个结构正确、TTL 可控的占位 Token,
 * 足以让客户端联调走通代码路径。Token 本身无效,不能在真实 Agora Channel 中使用。
 *
 * <p><b>生产替换</b>:引入 Agora 官方
 * <a href="https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey/java">AccessToken2</a>
 * 构造真实 Token。构造签名逻辑保持本接口不变,外部调用方无感。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AgoraTokenService {

    private final AgoraProperties props;
    private final StringRedisTemplate redis;

    /**
     * 为学员/助教/数字人签发课堂 Token
     *
     * @param roomId  Agora Channel 名(= class_id 变形)
     * @param uid     用户 UID(dt_/as_/st_ 前缀)
     * @param role    角色:BROADCASTER(主播)或 AUDIENCE(旁听)
     * @return 带缓存的 Token 信息
     */
    public TokenInfo issue(String roomId, String uid, AgoraRole role) {
        String cacheKey = "rtc:token:" + roomId + ":" + uid;
        String cached = redis.opsForValue().get(cacheKey);
        if (cached != null) {
            log.debug("token cache hit · room={} uid={}", roomId, uid);
            return new TokenInfo(cached, props.getTokenTtlSeconds());
        }

        String token = buildMockToken(roomId, uid, role);
        // 缓存 TTL 比 Token 本身短 5 分钟,避免临界过期问题
        long cacheTtl = Math.max(props.getTokenTtlSeconds() - 300, 60);
        redis.opsForValue().set(cacheKey, token, Duration.ofSeconds(cacheTtl));

        log.info("token issued · room={} uid={} role={} ttl={}s",
                roomId, uid, role, props.getTokenTtlSeconds());
        return new TokenInfo(token, props.getTokenTtlSeconds());
    }

    /**
     * Mock 实现:构造一个结构像样的占位 Token。
     * 格式:{appId}:{uid}:{role}:{exp}:{randomSig}
     * 注意:这不是真实 Agora Token,仅供联调。
     */
    private String buildMockToken(String roomId, String uid, AgoraRole role) {
        if (props.getAppId() == null || props.getAppId().isBlank()) {
            log.warn("AGORA_APP_ID 未配置 · 使用 dummy AppID (仅供联调)");
        }
        long exp = System.currentTimeMillis() / 1000 + props.getTokenTtlSeconds();
        byte[] sigBytes = new byte[16];
        new SecureRandom().nextBytes(sigBytes);
        String sig = Base64.getUrlEncoder().withoutPadding().encodeToString(sigBytes);
        String appId = props.getAppId() == null ? "mock_app" : props.getAppId();
        return String.format("%s:%s:%s:%d:%s", appId, uid, role.name(), exp, sig);
    }

    public enum AgoraRole {
        BROADCASTER, AUDIENCE
    }

    public record TokenInfo(String token, int ttlSeconds) {}

    /** 配置绑定 */
    @Data
    @ConfigurationProperties(prefix = "app.agora")
    public static class AgoraProperties {
        private String appId;
        private String appCertificate;
        private int tokenTtlSeconds = 7200;
    }
}
