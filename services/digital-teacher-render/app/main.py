"""数字人渲染服务入口"""
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI

from app.api import render_router
from app.services.agora_publisher import AgoraPublisher
from app.services.render_pipeline import RenderPipeline
from app.settings import settings

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("render.startup", gpu=settings.gpu_enabled)
    app.state.publisher = AgoraPublisher(settings)
    app.state.pipeline = RenderPipeline(app.state.publisher)
    yield
    await app.state.publisher.close()
    log.info("render.shutdown")


app = FastAPI(
    title="Digital Teacher Render",
    description="数字人渲染 · TTS + 唇形 + 板书 + Agora 推流",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(render_router.router, prefix="/internal/v1", tags=["render"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "digital-teacher-render"}
