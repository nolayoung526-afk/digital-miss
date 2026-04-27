"""Replicate adapter 工厂路由 + 无 token 时的清晰错误"""
from __future__ import annotations

import os

import pytest


def test_factory_returns_replicate_when_env_set(monkeypatch):
    monkeypatch.setenv("ADAPTER_AVATAR", "replicate")
    monkeypatch.setenv("ADAPTER_TTS", "replicate")
    from app.adapters import get_avatar_adapter, get_tts_adapter

    assert get_avatar_adapter().vendor_name == "replicate"
    assert get_tts_adapter().vendor_name == "replicate"


def test_unknown_vendor_raises(monkeypatch):
    monkeypatch.setenv("ADAPTER_AVATAR", "bogus")
    from app.adapters import get_avatar_adapter

    with pytest.raises(ValueError, match="unknown avatar vendor"):
        get_avatar_adapter()


@pytest.mark.asyncio
async def test_replicate_avatar_no_token_clear_error(monkeypatch):
    monkeypatch.delenv("REPLICATE_API_TOKEN", raising=False)
    from app.adapters.avatar_replicate import ReplicateAvatarAdapter

    adapter = ReplicateAvatarAdapter()
    with pytest.raises(RuntimeError, match="REPLICATE_API_TOKEN"):
        await adapter.render("avatar.jpg", "audio.wav")


@pytest.mark.asyncio
async def test_replicate_tts_no_token_clear_error(monkeypatch):
    monkeypatch.delenv("REPLICATE_API_TOKEN", raising=False)
    from app.adapters.tts_replicate import ReplicateTtsAdapter

    adapter = ReplicateTtsAdapter()
    with pytest.raises(RuntimeError, match="REPLICATE_API_TOKEN"):
        await adapter.synthesize("voice.wav", "你好")


@pytest.mark.skipif(
    not os.getenv("REPLICATE_API_TOKEN"),
    reason="集成测试 · 需要真实 Token · CI 跳过",
)
@pytest.mark.asyncio
async def test_replicate_tts_real_call_smoke():
    """真实调 Replicate 跑一次 · 仅本地有 token 时执行"""
    from app.adapters.tts_replicate import ReplicateTtsAdapter

    adapter = ReplicateTtsAdapter()
    result = await adapter.synthesize(
        "https://example.com/sample.wav",  # 测试时换真 URL
        "测试,你好",
    )
    assert result.audio_url
