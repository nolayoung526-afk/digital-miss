"""digital-teacher-render · 最基础的 smoke test"""
import pytest


def test_settings_load():
    """验证 Settings 能加载(硬约束默认值)"""
    from app.settings import settings
    assert settings.lip_sync_tolerance_ms == 80
    assert settings.tts_fade_out_ms == 200


def test_schema_validation():
    """验证 Scene Pydantic 模型"""
    from app.models import Scene, BoardAction

    scene = Scene(
        scene_id="sc_01",
        tts_text="你好小朋友",
        board_actions=[
            BoardAction(type="write_text", pos=[10, 20], content="1+1=?", duration_ms=500),
        ],
    )
    assert scene.scene_id == "sc_01"
    assert scene.board_actions[0].type == "write_text"
