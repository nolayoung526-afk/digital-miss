"""内部 API · class-orchestrator / fallback-executor 调用"""
from fastapi import APIRouter, BackgroundTasks, Request

from app.models import FadeOutRequest, RenderRequest, ResumeRequest

router = APIRouter()


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
