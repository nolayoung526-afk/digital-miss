package com.wandou.assetmgr.adapter.mock;

import com.wandou.assetmgr.adapter.AvatarRenderAdapter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "wandou.adapter.avatar", havingValue = "mock", matchIfMissing = true)
public class MockAvatarAdapter implements AvatarRenderAdapter {
    @Override
    public String vendorName() {
        return "mock";
    }

    @Override
    public String createAvatar(String photoOssUrl, String displayName) {
        return "mock_avatar_" + UUID.randomUUID();
    }
}
