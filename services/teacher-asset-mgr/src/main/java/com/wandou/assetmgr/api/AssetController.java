package com.wandou.assetmgr.api;

import com.wandou.assetmgr.api.dto.UploadAssetResponse;
import com.wandou.assetmgr.service.LocalAssetStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * 素材上传 · 教研后台 dropzone 调用。
 *
 * <p>kind 三选一:
 * <ul>
 *   <li>photo · 肖像照 · jpg/jpeg/png</li>
 *   <li>voice · 音频样本 · wav/mp3/m4a(10 句分片上传即可)</li>
 *   <li>license · 授权书 · pdf/jpg/png</li>
 * </ul>
 *
 * <p>personaKey 是业务侧自定义的 Persona 识别码(如 {@code persona_001_doudou}),
 * 与后续 {@code POST /persona/clone} 的 {@code realTeacherId} 建议一致。
 */
@Slf4j
@Tag(name = "Asset", description = "素材上传")
@RestController
@RequestMapping("/api/v1/asset")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:5175"})
public class AssetController {

    private final LocalAssetStorageService storage;

    @Operation(summary = "上传素材(multipart)")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadAssetResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("kind") String kind,
            @RequestParam("personaKey") String personaKey) throws IOException {

        LocalAssetStorageService.StoredAsset stored = storage.store(file, kind, personaKey);
        return ResponseEntity.ok(new UploadAssetResponse(
                stored.url(), stored.size(), stored.sha256(), kind, personaKey));
    }
}
