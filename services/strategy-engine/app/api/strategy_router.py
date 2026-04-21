"""策略生成接口 · 对齐 PRD 卷三 §3.4"""
from fastapi import APIRouter, HTTPException, Request

from app.models import ClassProfile, StrategyConfig, StudentProfile
from app.rules.engine import StrategyEngine

router = APIRouter()


@router.get("/class/{class_id}/next", response_model=StrategyConfig, summary="生成下节课策略")
async def next_strategy(class_id: str, request: Request) -> StrategyConfig:
    store = request.app.state.profile_store
    registry = request.app.state.rule_registry

    class_profile = await store.get_class(class_id)
    if class_profile is None:
        class_profile = ClassProfile(class_id=class_id)

    # 简化:MVP 不从数据库查班级学员 · 后续对接 class-orchestrator 的 /live-class/{id}
    # MVP 通过请求 Header 或另一接口注入学员 ID 列表
    student_profiles: list[StudentProfile] = []

    engine = StrategyEngine(registry)
    return engine.generate(class_id, class_profile, student_profiles)


@router.post("/generate", response_model=StrategyConfig, summary="显式入参生成策略(便于测试)")
async def generate_strategy(
    class_id: str,
    class_profile: ClassProfile,
    student_profiles: list[StudentProfile],
    request: Request,
) -> StrategyConfig:
    if not class_id:
        raise HTTPException(400, "class_id is required")
    registry = request.app.state.rule_registry
    engine = StrategyEngine(registry)
    return engine.generate(class_id, class_profile, student_profiles)
