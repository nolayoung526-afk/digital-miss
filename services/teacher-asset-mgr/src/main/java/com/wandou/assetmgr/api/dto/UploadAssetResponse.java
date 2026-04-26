package com.wandou.assetmgr.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UploadAssetResponse {
    private String url;
    private long size;
    private String sha256;
    private String kind;
    private String personaKey;
}
