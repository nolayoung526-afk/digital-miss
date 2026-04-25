"""TTS adapter 接口 · 解耦厂商。

对比现有 app/services/tts.py:
  · tts.py 保留为"主备双通道 + 打断" 编排层(更复杂的业务逻辑)
  · 本 adapter 专注"文本 → 音频" 单次合成,更接近厂商 REST API

渐进路径:
  Sprint 2: render_pipeline 对接 adapter · 替代当前 tts.py 的 placeholder
  Sprint 3+: tts.py 编排层包装 adapter,加主备切换 + 流式打断
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class TtsResult:
    audio_url: str           # OSS / 公网音频 URL
    duration_ms: int
    vendor_task_id: str


class TtsAdapter(Protocol):

    @property
    def vendor_name(self) -> str:
        ...

    async def synthesize(
        self,
        vendor_voice_id: str,
        text: str,
        speed: float = 1.0,
        emotion: str = "neutral",
    ) -> TtsResult:
        """
        Args:
            vendor_voice_id: teacher-asset-mgr 存的 persona.vendor_voice_id
            text: 待合成话术(≤5000 字)
            speed: 0.5-2.0
            emotion: neutral/happy/excited/sad/... 厂商差异
        """
        ...
