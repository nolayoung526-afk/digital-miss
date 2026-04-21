"""渲染相关数据模型"""
from typing import Literal, Optional

from pydantic import BaseModel, Field


class BoardAction(BaseModel):
    type: Literal["write_text", "rect", "line", "arrow", "clear", "undo", "gesture"]
    pos: Optional[list[int]] = None
    content: Optional[str] = None
    color: Optional[str] = None
    duration_ms: int = 500


class Scene(BaseModel):
    scene_id: str
    tts_text: str
    board_actions: list[BoardAction] = Field(default_factory=list)
    emotion: str = "cheerful"
    gesture: Optional[str] = None


class RenderRequest(BaseModel):
    class_id: str
    persona_id: str
    scenes: list[Scene]
    rtc_room: str
    # 来自策略引擎的个性化参数
    tts_speed: float = 1.0
    board_density: Literal["sparse", "medium", "dense"] = "medium"


class FadeOutRequest(BaseModel):
    class_id: str
    fade_ms: int = 200


class Breakpoint(BaseModel):
    scene_id: str
    char_offset: int
    audio_ms: int


class ResumeRequest(BaseModel):
    class_id: str
    breakpoint: Breakpoint
    transition_prefix: str = "好,我们继续..."
