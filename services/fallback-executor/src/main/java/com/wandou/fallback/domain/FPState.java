package com.wandou.fallback.domain;

public enum FPState {
    IDLE,
    EXECUTING,      // L2 数字人执行预设话术
    RECOVERED,      // L1/L2 成功恢复
    ESCALATING,     // 升级 L3 · 呼叫助教
    TAKEN_OVER,     // 助教已接管
    ABORTED         // 熔断 · 补课
}
