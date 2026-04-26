package com.wandou.assetmgr;

import com.wandou.assetmgr.service.LocalAssetStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.nio.file.Files;
import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class AssetUploadTest {

    @Autowired
    private LocalAssetStorageService storage;

    @Test
    void uploadPhotoSucceeds() throws Exception {
        var file = new MockMultipartFile("file", "portrait.jpg", "image/jpeg", new byte[]{1, 2, 3, 4, 5});
        var stored = storage.store(file, "photo", "persona_test_001");

        assertThat(stored.url()).startsWith("/assets/persona_test_001/photo/");
        assertThat(stored.url()).endsWith(".jpg");
        assertThat(stored.size()).isEqualTo(5);
        assertThat(stored.sha256()).hasSize(64);
        assertThat(Files.exists(Paths.get(stored.localPath()))).isTrue();
    }

    @Test
    void uploadVoiceAcceptsWav() throws Exception {
        var file = new MockMultipartFile("file", "01.wav", "audio/wav", new byte[]{0, 0, 0});
        var stored = storage.store(file, "voice", "persona_test_002");
        assertThat(stored.url()).contains("/voice/").endsWith(".wav");
    }

    @Test
    void rejectsWrongExtension() {
        var file = new MockMultipartFile("file", "portrait.gif", "image/gif", new byte[]{1, 2});
        assertThatThrownBy(() -> storage.store(file, "photo", "p1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("invalid extension");
    }

    @Test
    void rejectsUnknownKind() {
        var file = new MockMultipartFile("file", "x.jpg", "image/jpeg", new byte[]{1});
        assertThatThrownBy(() -> storage.store(file, "bogus", "p1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unknown kind");
    }

    @Test
    void rejectsPathTraversal() throws Exception {
        var file = new MockMultipartFile("file", "../../etc/passwd.jpg", "image/jpeg", new byte[]{1});
        // personaKey 会被 safe-name,本身不会穿越;文件名部分会被 sanitize 成 __etc_passwd.jpg
        var stored = storage.store(file, "photo", "../evil");
        assertThat(stored.localPath()).doesNotContain("..").doesNotContain("etc/passwd");
    }
}
