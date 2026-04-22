"""Mock TTS · 返回固定音频 URL · 不发外网。"""
from __future__ import annotations

import asyncio
import uuid

from app.adapters.tts_base import TtsAdapter, TtsResult


class MockTtsAdapter(TtsAdapter):
    @property
    def vendor_name(self) -> str:
        return "mock"

    async def synthesize(
        self,
        vendor_voice_id: str,
        text: str,
        speed: float = 1.0,
        emotion: str = "neutral",
    ) -> TtsResult:
        await asyncio.sleep(0.1)
        # 按字数粗估时长:中文约 4 字/秒 · 考虑 speed
        char_count = len(text)
        duration_ms = int((char_count / 4) * 1000 / speed)
        return TtsResult(
            audio_url=f"mock://audio/{uuid.uuid4()}.wav",
            duration_ms=duration_ms,
            vendor_task_id=f"mock_tts_{uuid.uuid4()}",
        )
