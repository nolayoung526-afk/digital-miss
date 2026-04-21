"""Agora Server SDK 封装 · 作为 Broadcaster 虚拟推流
生产需接入 agora-python-server-sdk(私有制品)
"""
from __future__ import annotations

import structlog

from app.settings import Settings

log = structlog.get_logger()


class AgoraPublisher:
    """占位实现 · 关键接口 join / publishAudioFrame / publishVideoFrame / leave"""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._channels: dict[str, bool] = {}

    async def join(self, channel: str, uid: str) -> None:
        if not self.settings.agora_app_id:
            log.warning("agora.app_id.missing", channel=channel)
        self._channels[channel] = True
        log.info("agora.join", channel=channel, uid=uid)

    async def publish_audio_frame(self, channel: str, pcm: bytes) -> None:
        if channel not in self._channels:
            return
        # TODO: agora.push_audio_frame(pcm, 48000, 1)
        pass

    async def publish_video_frame(self, channel: str, frame: bytes) -> None:
        if channel not in self._channels:
            return
        # TODO: agora.push_video_frame(frame, width, height, rotation)
        pass

    async def leave(self, channel: str) -> None:
        self._channels.pop(channel, None)
        log.info("agora.leave", channel=channel)

    async def close(self) -> None:
        for ch in list(self._channels.keys()):
            await self.leave(ch)
