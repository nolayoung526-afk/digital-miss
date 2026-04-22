"""渲染主流水线 · 编排 TTS + 唇形 + 板书 + 推流"""
from __future__ import annotations

import numpy as np
import structlog

from app.models import Breakpoint, RenderRequest, Scene
from app.services.agora_publisher import AgoraPublisher
from app.services.board_renderer import board_renderer
from app.services.lip_sync import lip_sync
from app.services.tts import tts_client

log = structlog.get_logger()


class RenderPipeline:
    """一个 class_id 对应一个渲染上下文 · 管理当前进度 / 断点"""

    def __init__(self, publisher: AgoraPublisher):
        self.publisher = publisher
        # class_id → { current_scene, char_offset, audio_ms }
        self._state: dict[str, dict] = {}

    async def start_render(self, req: RenderRequest) -> None:
        """入频道 + 按序渲染每个分镜"""
        await self.publisher.join(req.rtc_room, uid=f"dt_{req.class_id}")
        lip_sync.load(req.persona_id)
        self._state[req.class_id] = {"char_offset": 0, "scene_id": None, "audio_ms": 0}

        for scene in req.scenes:
            await self._render_scene(req.class_id, scene, req.tts_speed)

    async def _render_scene(self, class_id: str, scene: Scene, speed: float) -> None:
        self._state[class_id]["scene_id"] = scene.scene_id
        self._state[class_id]["char_offset"] = 0
        log.info("scene.start", class_id=class_id, scene_id=scene.scene_id)

        # 板书先行(数字人"准备"动作)
        await board_renderer.apply(class_id, scene.board_actions)

        # TTS 流式推送
        audio_buffer = bytearray()
        async for chunk in tts_client.synthesize(
            class_id, scene.tts_text, speed=speed, emotion=scene.emotion
        ):
            audio_buffer.extend(chunk)
            await self.publisher.publish_audio_frame(
                f"rtc_{class_id}", bytes(chunk)
            )
            # 更新播放进度(简化 · 生产按字符精度)
            self._state[class_id]["audio_ms"] += 100

        # 计算唇形
        pcm = np.frombuffer(bytes(audio_buffer), dtype=np.int16)
        visemes = lip_sync.generate_visemes(pcm)
        log.info("scene.done", class_id=class_id, visemes=len(visemes))

    async def fade_out(self, class_id: str, fade_ms: int) -> Breakpoint | None:
        """Barge-in 场景:淡出 TTS + 返回断点"""
        await tts_client.fade_out(class_id, fade_ms)
        st = self._state.get(class_id)
        if not st or not st.get("scene_id"):
            return None
        return Breakpoint(
            scene_id=st["scene_id"],
            char_offset=st["char_offset"],
            audio_ms=st["audio_ms"],
        )

    async def resume(self, class_id: str, breakpoint: Breakpoint, prefix: str) -> None:
        """从断点续播 · 先念过渡句,再续上"""
        # TODO: 真实实现需知晓剩余文本,这里占位
        log.info(
            "resume",
            class_id=class_id,
            scene=breakpoint.scene_id,
            offset=breakpoint.char_offset,
        )
