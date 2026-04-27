"""Replicate · OpenVoice / F5-TTS 声音克隆 adapter。

调用模式(零训练 · 直接推理):
  vendor_voice_id = 老师音频样本 URL(http://localhost:8082/assets/.../voice/01.wav)
  text            = 待合成话术
  → 调 Replicate `cjwbw/openvoice` (or 配置) → 返回合成音频 URL

成本:单次 ~$0.01 USD · $5 试用额够 500 次。
"""
from __future__ import annotations

import os
from typing import Any

import structlog

from app.adapters.tts_base import TtsAdapter, TtsResult

log = structlog.get_logger()


class ReplicateTtsAdapter(TtsAdapter):
    """OpenVoice 等零样本克隆 TTS · Replicate 托管"""

    def __init__(self):
        self._model = os.getenv("REPLICATE_TTS_MODEL", "cjwbw/openvoice")
        self._token = os.getenv("REPLICATE_API_TOKEN")
        self._client: Any = None

    @property
    def vendor_name(self) -> str:
        return "replicate"

    def _client_or_raise(self):
        if not self._token:
            raise RuntimeError(
                "REPLICATE_API_TOKEN 未配置 · 在 services/digital-teacher-render/.env.local 设置"
            )
        if self._client is None:
            import replicate  # noqa: PLC0415
            self._client = replicate.Client(api_token=self._token)
        return self._client

    async def synthesize(
        self,
        vendor_voice_id: str,
        text: str,
        speed: float = 1.0,
        emotion: str = "neutral",
    ) -> TtsResult:
        client = self._client_or_raise()
        log.info(
            "replicate.tts.start",
            model=self._model,
            voice_sample=vendor_voice_id,
            chars=len(text),
        )

        output = client.run(
            self._model,
            input={
                "text": text,
                "audio": vendor_voice_id,        # OpenVoice: 参考音色样本
                "speaker": vendor_voice_id,      # 兼容字段
                "speed": speed,
                "language": "Chinese",
                "emotion": emotion,
            },
        )

        audio_url = output[0] if isinstance(output, list) and output else (
            output if isinstance(output, str) else None
        )
        if not audio_url:
            raise RuntimeError(f"Replicate 未返回音频 URL · output={output!r}")

        # 粗估时长:中文 ~4 字/秒 / speed
        duration_ms = int((len(text) / 4) * 1000 / speed)

        log.info("replicate.tts.done", url=audio_url, duration_ms=duration_ms)
        return TtsResult(
            audio_url=str(audio_url),
            duration_ms=duration_ms,
            vendor_task_id=f"replicate_{self._model}",
        )
