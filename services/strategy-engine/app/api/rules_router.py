"""规则管理接口 · 列表 / reload"""
from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/", summary="列出当前生效规则")
async def list_rules(request: Request):
    registry = request.app.state.rule_registry
    return {
        "version": registry.version(),
        "count": len(registry.all()),
        "rules": [r.model_dump() for r in registry.all()],
    }


@router.post("/reload", summary="热加载规则(开发 / 紧急修复用)")
async def reload_rules(request: Request):
    from app.settings import settings
    registry = request.app.state.rule_registry
    registry.load_from_path(settings.rules_path)
    return {"reloaded": True, "count": len(registry.all())}
