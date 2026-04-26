"""厂商 Adapter 层 · 解耦 Persona 渲染 / TTS 的业务逻辑与具体厂商 SDK。

路由:通过 env 切换实现,不改业务代码。

  ADAPTER_AVATAR=mock | replicate | tencent_yinsu | heygen
  ADAPTER_TTS=mock    | replicate | minimax | tencent_tts | elevenlabs

工厂接入:
  from app.adapters import get_avatar_adapter, get_tts_adapter
"""
from __future__ import annotations

import os

from app.adapters.avatar_base import AvatarRenderAdapter
from app.adapters.avatar_mock import MockAvatarAdapter
from app.adapters.avatar_replicate import ReplicateAvatarAdapter
from app.adapters.tts_base import TtsAdapter
from app.adapters.tts_mock import MockTtsAdapter
from app.adapters.tts_replicate import ReplicateTtsAdapter


def get_avatar_adapter() -> AvatarRenderAdapter:
    vendor = os.getenv("ADAPTER_AVATAR", "mock")
    if vendor == "mock":
        return MockAvatarAdapter()
    if vendor == "replicate":
        return ReplicateAvatarAdapter()
    # TODO Sprint 3+ 接入:
    # if vendor == "tencent_yinsu": return TencentYinsuAdapter()
    # if vendor == "heygen": return HeyGenAdapter()
    raise ValueError(f"unknown avatar vendor: {vendor}")


def get_tts_adapter() -> TtsAdapter:
    vendor = os.getenv("ADAPTER_TTS", "mock")
    if vendor == "mock":
        return MockTtsAdapter()
    if vendor == "replicate":
        return ReplicateTtsAdapter()
    # TODO Sprint 3+ 接入:
    # if vendor == "minimax": return MinimaxTtsAdapter()
    # if vendor == "tencent_tts": return TencentTtsAdapter()
    raise ValueError(f"unknown tts vendor: {vendor}")


__all__ = [
    "AvatarRenderAdapter",
    "TtsAdapter",
    "get_avatar_adapter",
    "get_tts_adapter",
]
