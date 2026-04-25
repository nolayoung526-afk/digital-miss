"""Mock 形象渲染 · 返回固定示例视频 · 不发外网请求 · 用于本地 / CI。"""
from __future__ import annotations

import asyncio
import uuid

from app.adapters.avatar_base import AvatarRenderAdapter, VideoRenderResult


class MockAvatarAdapter(AvatarRenderAdapter):
    @property
    def vendor_name(self) -> str:
        return "mock"

    async def render(
        self,
        vendor_avatar_id: str,
        audio_url: str,
        resolution: str = "720p",
    ) -> VideoRenderResult:
        # 模拟厂商 API 约 200ms 响应
        await asyncio.sleep(0.2)
        return VideoRenderResult(
            video_url=f"mock://video/{uuid.uuid4()}.mp4",
            duration_ms=5000,
            vendor_task_id=f"mock_task_{uuid.uuid4()}",
        )
