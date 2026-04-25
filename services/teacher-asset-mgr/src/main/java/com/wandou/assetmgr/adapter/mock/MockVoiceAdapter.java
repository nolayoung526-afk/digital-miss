package com.wandou.assetmgr.adapter.mock;

import com.wandou.assetmgr.adapter.VoiceCloneAdapter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "wandou.adapter.voice", havingValue = "mock", matchIfMissing = true)
public class MockVoiceAdapter implements VoiceCloneAdapter {
    @Override
    public String vendorName() {
        return "mock";
    }

    @Override
    public String cloneVoice(String audioOssUrl, String displayName) {
        return "mock_voice_" + UUID.randomUUID();
    }
}
