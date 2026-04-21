"""板书引擎 · 脚本指令 → 视频帧叠加
与 packages/board-engine 前端实现保持接口对齐(同一套 BoardAction 结构)
"""
from __future__ import annotations

import structlog

from app.models import BoardAction

log = structlog.get_logger()


class BoardRenderer:
    """占位实现 · 生产用 skia-python / cairo 渲染 Canvas → 合并到视频帧"""

    async def apply(self, class_id: str, actions: list[BoardAction]) -> None:
        for a in actions:
            log.info(
                "board.apply",
                class_id=class_id,
                type=a.type,
                pos=a.pos,
                content=a.content,
            )
            # TODO:
            #   write_text → 按笔画生成 stroke 帧(60fps 手写动画)
            #   rect       → SVG path → 栅格化叠加
            #   clear      → 渐隐 alpha 动画
            #   undo       → 擦除上一笔
            #   gesture    → 数字人手指动画联动

    async def undo(self, class_id: str) -> None:
        log.info("board.undo", class_id=class_id)

    async def clear(self, class_id: str) -> None:
        log.info("board.clear", class_id=class_id)


board_renderer = BoardRenderer()
