"""内部 API · class-orchestrator / fallback-executor 调用"""
from fastapi import APIRouter, BackgroundTasks, Request
from pydantic import BaseModel, Field

from app.models import FadeOutRequest, RenderRequest, ResumeRequest
from app.services.persona_synth import synthesize_persona_utterance

router = APIRouter()


class PersonaSynthRequest(BaseModel):
    vendor_voice_id: str
    vendor_avatar_id: str
    text: str = Field(..., min_length=1, max_length=5000)
    speed: float = 1.0
    emotion: str = "neutral"
    resolution: str = "720p"


@router.post("/render/start", summary="开始渲染(异步)")
async def render_start(req: RenderRequest, bg: BackgroundTasks, request: Request):
    pipeline = request.app.state.pipeline
    bg.add_task(pipeline.start_render, req)
    return {"accepted": True, "class_id": req.class_id}


@router.post("/render/fade-out", summary="Barge-in 淡出 · 返回断点")
async def render_fade_out(req: FadeOutRequest, request: Request):
    pipeline = request.app.state.pipeline
    bp = await pipeline.fade_out(req.class_id, req.fade_ms)
    return {"class_id": req.class_id, "breakpoint": bp.model_dump() if bp else None}


@router.post("/render/resume", summary="从断点续播")
async def render_resume(req: ResumeRequest, request: Request):
    pipeline = request.app.state.pipeline
    await pipeline.resume(req.class_id, req.breakpoint, req.transition_prefix)
    return {"class_id": req.class_id, "resumed": True}


@router.post("/persona/synth", summary="单次 Persona 话术 → 视频")
async def persona_synth(req: PersonaSynthRequest):
    result = await synthesize_persona_utterance(
        vendor_voice_id=req.vendor_voice_id,
        vendor_avatar_id=req.vendor_avatar_id,
        text=req.text,
        speed=req.speed,
        emotion=req.emotion,
        resolution=req.resolution,
    )
    return {
        "audio_url": result.audio_url,
        "video_url": result.video_url,
        "duration_ms": result.duration_ms,
        "tts_vendor": result.tts_vendor,
        "avatar_vendor": result.avatar_vendor,
    }
