"""Persona 话术 → TTS → 形象视频 的一站式编排。

与 render_pipeline 的分工:
  · render_pipeline:多场景 + 推流 + 打断 + 唇形(实时流式)
  · persona_synth:单次话术合成 mp4(批处理 / 预生成 / 试听)

Sprint 2 首节真实课:教研可先用这个接口 pre-generate 每个分镜的 mp4,
然后 class-orchestrator 按顺序下发,降低首节课实时渲染的稳定性风险。
"""
from __future__ import annotations

from dataclasses import dataclass

import structlog

from app.adapters import get_avatar_adapter, get_tts_adapter

log = structlog.get_logger()


@dataclass
class PersonaSynthResult:
    audio_url: str
    video_url: str
    duration_ms: int
    tts_vendor: str
    avatar_vendor: str


async def synthesize_persona_utterance(
    vendor_voice_id: str,
    vendor_avatar_id: str,
    text: str,
    speed: float = 1.0,
    emotion: str = "neutral",
    resolution: str = "720p",
) -> PersonaSynthResult:
    """文本 → 音频 → 视频 · 两步走。"""
    tts = get_tts_adapter()
    avatar = get_avatar_adapter()

    tts_res = await tts.synthesize(vendor_voice_id, text, speed=speed, emotion=emotion)
    log.info(
        "persona.tts.done",
        vendor=tts.vendor_name,
        duration_ms=tts_res.duration_ms,
        task=tts_res.vendor_task_id,
    )

    avatar_res = await avatar.render(vendor_avatar_id, tts_res.audio_url, resolution=resolution)
    log.info(
        "persona.avatar.done",
        vendor=avatar.vendor_name,
        duration_ms=avatar_res.duration_ms,
        task=avatar_res.vendor_task_id,
    )

    return PersonaSynthResult(
        audio_url=tts_res.audio_url,
        video_url=avatar_res.video_url,
        duration_ms=avatar_res.duration_ms,
        tts_vendor=tts.vendor_name,
        avatar_vendor=avatar.vendor_name,
    )
