package com.wandou.assetmgr.adapter;

/**
 * TTS 声音克隆 adapter。
 *
 * 实现:
 * · {@link com.wandou.assetmgr.adapter.mock.MockVoiceAdapter} — 默认
 * · MinimaxVoiceAdapter — Sprint 2 接入
 * · TencentTtsVoiceAdapter — 备选
 */
public interface VoiceCloneAdapter {
    String vendorName();

    /**
     * 上传音频样本训练声音克隆 · 返回厂商 voice_id。
     * MVP 阶段同步 · 真实厂商 1-5 分钟完成。
     */
    String cloneVoice(String audioOssUrl, String displayName);
}
