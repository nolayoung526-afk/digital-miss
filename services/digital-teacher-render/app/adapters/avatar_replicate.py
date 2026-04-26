"""Replicate · MuseTalk 形象渲染 adapter。

调用模式(零训练 · 直接推理):
  vendor_avatar_id = 学员照片 URL(http://localhost:8082/assets/.../photo/x.jpg)
  audio_url        = TTS 产物 URL
  → 调 Replicate `cuuupid/musetalk` (or 配置的模型) → 返回 mp4 URL

成本:单次 ~$0.05 USD · $5 试用额够 100 次。

Token 来源:`REPLICATE_API_TOKEN` 环境变量(本地 .env.local · 生产 K8s Secret)。
"""
from __future__ import annotations

import os
from typing import Any

import structlog

from app.adapters.avatar_base import AvatarRenderAdapter, VideoRenderResult

log = structlog.get_logger()


class ReplicateAvatarAdapter(AvatarRenderAdapter):
    """Replicate 托管的 MuseTalk / SadTalker / Wav2Lip 等模型 · 走 HTTPS API"""

    def __init__(self):
        self._model = os.getenv("REPLICATE_AVATAR_MODEL", "cuuupid/musetalk")
        self._token = os.getenv("REPLICATE_API_TOKEN")
        self._client: Any = None  # 延迟初始化避免无 token 时启动报错

    @property
    def vendor_name(self) -> str:
        return "replicate"

    def _client_or_raise(self):
        if not self._token:
            raise RuntimeError(
                "REPLICATE_API_TOKEN 未配置 · 在 services/digital-teacher-render/.env.local 设置"
            )
        if self._client is None:
            import replicate  # noqa: PLC0415  延迟导入,避免无环境变量启动崩
            self._client = replicate.Client(api_token=self._token)
        return self._client

    async def render(
        self,
        vendor_avatar_id: str,
        audio_url: str,
        resolution: str = "720p",
    ) -> VideoRenderResult:
        client = self._client_or_raise()
        log.info(
            "replicate.avatar.start",
            model=self._model,
            avatar=vendor_avatar_id,
            audio=audio_url,
        )

        # MuseTalk 等模型的入参结构:image + audio
        # 不同模型字段名略有差异,这里用最常见组合 · 切模型时可改
        output = client.run(
            self._model,
            input={
                "video": vendor_avatar_id,  # MuseTalk 接受静态图作为 1 帧 video
                "image": vendor_avatar_id,  # 兼容 wav2lip 类
                "audio": audio_url,
                "fps": 25,
            },
        )

        # Replicate 返回的可能是 str(url) 或 list(urls)
        video_url = output[0] if isinstance(output, list) and output else (
            output if isinstance(output, str) else None
        )
        if not video_url:
            raise RuntimeError(f"Replicate 未返回视频 URL · output={output!r}")

        log.info("replicate.avatar.done", url=video_url)
        return VideoRenderResult(
            video_url=str(video_url),
            duration_ms=0,  # Replicate 不直接给时长,可后处理读 mp4 metadata
            vendor_task_id=f"replicate_{self._model}",
        )
