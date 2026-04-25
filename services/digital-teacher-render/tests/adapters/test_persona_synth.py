"""Persona 合成编排单测 · 全 Mock 不发外网"""
from __future__ import annotations

import pytest

from app.services.persona_synth import synthesize_persona_utterance


@pytest.mark.asyncio
async def test_synthesize_persona_utterance_mock():
    result = await synthesize_persona_utterance(
        vendor_voice_id="mock_voice_abc",
        vendor_avatar_id="mock_avatar_xyz",
        text="小朋友们好,我们今天学加法。",
        speed=1.0,
        emotion="happy",
    )

    assert result.tts_vendor == "mock"
    assert result.avatar_vendor == "mock"
    assert result.audio_url.startswith("mock://audio/")
    assert result.video_url.startswith("mock://video/")
    assert result.duration_ms > 0


@pytest.mark.asyncio
async def test_adapter_vendor_name_consistency():
    from app.adapters import get_avatar_adapter, get_tts_adapter

    assert get_tts_adapter().vendor_name == "mock"
    assert get_avatar_adapter().vendor_name == "mock"
