package com.wandou.assetmgr.service;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 素材存储配置 · 决定上传到本地 / OSS / S3
 *
 * MVP 默认 local · Sprint 3+ 切 OSS 只改 bean 实现
 */
@Data
@ConfigurationProperties(prefix = "wandou.asset-storage")
public class AssetStorageProperties {
    /** local / oss · MVP 只实现 local */
    private String type = "local";

    /** 本地根目录 · 绝对路径 · 默认 ./assets/personas */
    private String localRoot = "./assets/personas";

    /** 对外 URL 前缀 · 用于静态 serve · 例:/assets 或 https://oss.../assets */
    private String urlPrefix = "/assets";

    /** 允许的最大文件大小 MB */
    private long maxFileSizeMb = 50;
}
