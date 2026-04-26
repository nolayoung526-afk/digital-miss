package com.wandou.assetmgr.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Set;

/**
 * 本地文件存储 · MVP 实现。
 *
 * <p>落盘结构:
 * <pre>
 * {localRoot}/{personaKey}/{kind}/{originalFilename}
 *   e.g. ./assets/personas/persona_001_doudou/photo/portrait.jpg
 *        ./assets/personas/persona_001_doudou/voice/01.wav
 *        ./assets/personas/persona_001_doudou/license/authorization.pdf
 * </pre>
 *
 * <p>返回对外可访问的 URL · 交给 Next.js / 厂商 adapter 使用
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LocalAssetStorageService {

    private final AssetStorageProperties props;

    private static final Set<String> ALLOWED_PHOTO = Set.of("jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_VOICE = Set.of("wav", "mp3", "m4a");
    private static final Set<String> ALLOWED_LICENSE = Set.of("pdf", "jpg", "jpeg", "png");

    public StoredAsset store(MultipartFile file, String kind, String personaKey) throws IOException {
        validate(file, kind);

        // 清洗 personaKey · 防目录穿越
        String key = safeName(personaKey);
        String ext = extensionOf(file.getOriginalFilename());
        String safeFilename = sanitizeFilename(file.getOriginalFilename(), ext);

        Path root = Paths.get(props.getLocalRoot()).toAbsolutePath().normalize();
        Path target = root.resolve(key).resolve(kind).resolve(safeFilename).normalize();

        // 防穿越
        if (!target.startsWith(root)) {
            throw new SecurityException("invalid path: " + target);
        }

        Files.createDirectories(target.getParent());
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        String sha256 = sha256(target);
        long size = Files.size(target);
        String url = props.getUrlPrefix() + "/" + key + "/" + kind + "/" + safeFilename;

        log.info("asset stored · key={} kind={} file={} size={} sha256={}",
                key, kind, safeFilename, size, sha256.substring(0, 8));

        return new StoredAsset(url, target.toString(), size, sha256);
    }

    private void validate(MultipartFile file, String kind) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("file is empty");
        }
        long maxBytes = props.getMaxFileSizeMb() * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException(
                    "file too large · max " + props.getMaxFileSizeMb() + "MB, got " + (file.getSize() / 1024 / 1024) + "MB");
        }
        String ext = extensionOf(file.getOriginalFilename());
        Set<String> allowed = switch (kind) {
            case "photo" -> ALLOWED_PHOTO;
            case "voice" -> ALLOWED_VOICE;
            case "license" -> ALLOWED_LICENSE;
            default -> throw new IllegalArgumentException("unknown kind: " + kind);
        };
        if (!allowed.contains(ext.toLowerCase())) {
            throw new IllegalArgumentException(
                    "invalid extension for " + kind + " · allowed: " + allowed + ", got: " + ext);
        }
    }

    private String extensionOf(String name) {
        if (name == null) return "";
        int i = name.lastIndexOf('.');
        return i < 0 ? "" : name.substring(i + 1);
    }

    /** 保留扩展名,身体部分替换为安全字符 · 不允许任何点(防 ..)和路径分隔符 */
    private String sanitizeFilename(String name, String ext) {
        if (name == null) return "file." + ext.toLowerCase();
        int lastDot = name.lastIndexOf('.');
        String base = lastDot > 0 ? name.substring(0, lastDot) : name;
        // 一次性把所有非安全字符(含点、斜杠、冒号、空格等)替成 _
        String safe = base.replaceAll("[^a-zA-Z0-9_\\-\\u4e00-\\u9fa5]", "_");
        // 折叠连续下划线 + trim
        safe = safe.replaceAll("_+", "_").replaceAll("^_+|_+$", "");
        if (safe.isBlank()) safe = "file";
        return safe + "." + ext.toLowerCase();
    }

    private String safeName(String s) {
        if (s == null || s.isBlank()) return "unknown";
        return s.replaceAll("[^a-zA-Z0-9_\\-]", "_");
    }

    private String sha256(Path path) throws IOException {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(Files.readAllBytes(path));
            return HexFormat.of().formatHex(md.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public record StoredAsset(String url, String localPath, long size, String sha256) {}
}
