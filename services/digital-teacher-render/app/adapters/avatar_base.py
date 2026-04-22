"""形象渲染 adapter 接口。

同步 API 兼容所有主流厂商的 REST 调用模式:
  · 腾讯智影:POST /videosynthesis → polling → mp4 URL
  · HeyGen:POST /v2/video/generate → polling → mp4 URL

返回的 VideoRenderResult 既可以被 digital-teacher-render 下载
后推声网 Server SDK,也可以作为 RTMP 直接推流地址转发。
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class VideoRenderResult:
    """渲染完成的视频产物 · 至少含 mp4 URL 供下载推流"""
    video_url: str
    duration_ms: int
    vendor_task_id: str


class AvatarRenderAdapter(Protocol):
    """形象渲染厂商 adapter"""

    @property
    def vendor_name(self) -> str:
        ...

    async def render(
        self,
        vendor_avatar_id: str,
        audio_url: str,
        resolution: str = "720p",
    ) -> VideoRenderResult:
        """
        给定厂商 avatar + 音频 URL,返回合成视频。

        Args:
            vendor_avatar_id: teacher-asset-mgr 存的 persona.vendor_avatar_id
            audio_url: OSS / 公网可访问的音频文件(TTS 产物)
            resolution: 720p / 1080p
        """
        ...
