package com.wandou.assetmgr.adapter;

/**
 * 形象渲染厂商 adapter · 用于克隆数字人 avatar。
 *
 * 实现:
 * · {@link com.wandou.assetmgr.adapter.mock.MockAvatarAdapter} — 默认,不发外网请求
 * · TencentYinsuAdapter — Sprint 2 接入(待 API Key)
 * · HeyGenAdapter — Plan B 备用
 */
public interface AvatarRenderAdapter {
    /** 当前厂商名,存到 persona.render_vendor */
    String vendorName();

    /**
     * 上传照片资产创建 avatar · 同步返回厂商内部 ID。
     * MVP 阶段同步调用即可 · 真实厂商多为 ~10s 完成。
     */
    String createAvatar(String photoOssUrl, String displayName);
}
