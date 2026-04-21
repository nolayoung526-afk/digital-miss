package com.wandou.fallback.domain;

public enum FPEvent {
    TRIGGER,            // 外部触发
    EXECUTION_OK,       // 预案执行成功恢复
    EXECUTION_TIMEOUT,  // 超时未恢复 · 升级
    TAKEOVER_OK,        // 助教接管成功
    TAKEOVER_TIMEOUT    // 助教 30s 未响应 · abort
}
