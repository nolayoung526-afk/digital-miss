"""TTS 双通道封装 · 主(自研)+ 备(火山)· 自动 fallback"""
from __future__ import annotations

import asyncio
from typing import AsyncIterator

import httpx
import structlog

from app.settings import settings

log = structlog.get_logger()


class TTSClient:
    """生产实现要点(占位)
    1. 主通道失败 > 3 次自动切备用(触发 FP-01)
    2. 暴露 fade_out(ms) 原子接口(卷四 §4.3)
    3. 每 50ms 吐出 char_offset + audio_ms(用于 Barge-in 断点)
    """

    def __init__(self):
        self._primary_failures = 0
        self._client = httpx.AsyncClient(timeout=settings.tts_primary_timeout_s)
        self._current_tasks: dict[str, asyncio.Task] = {}

    async def synthesize(
        self,
        class_id: str,
        text: str,
        speed: float = 1.0,
        emotion: str = "cheerful",
    ) -> AsyncIterator[bytes]:
        """流式合成音频(PCM 48kHz)· yield 音频帧"""
        try:
            async for chunk in self._synthesize_primary(text, speed, emotion):
                yield chunk
        except Exception as e:
            self._primary_failures += 1
            log.warning(
                "tts.primary.failed",
                class_id=class_id,
                count=self._primary_failures,
                err=str(e),
            )
            # TODO: Primary 失败 3 次触发 FP-01(发 Kafka fallback.triggers)
            async for chunk in self._synthesize_backup(text, speed):
                yield chunk

    async def _synthesize_primary(
        self, text: str, speed: float, emotion: str
    ) -> AsyncIterator[bytes]:
        # TODO: 调用自研 TTS API
        # 本地开发返回 mock 静音帧
        for i in range(20):
            await asyncio.sleep(0.05)
            yield b"\x00" * 4800  # 100ms @ 48kHz mono

    async def _synthesize_backup(
        self, text: str, speed: float
    ) -> AsyncIterator[bytes]:
        # TODO: 调用火山 / 微软 TTS
        for i in range(20):
            await asyncio.sleep(0.05)
            yield b"\x00" * 4800

    async def fade_out(self, class_id: str, fade_ms: int = 200) -> None:
        """原子淡出接口 · 用于 Barge-in(卷二 C6 / §6.3)"""
        task = self._current_tasks.pop(class_id, None)
        if task and not task.done():
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        log.info("tts.fade_out", class_id=class_id, fade_ms=fade_ms)

    async def close(self):
        await self._client.aclose()


tts_client = TTSClient()
