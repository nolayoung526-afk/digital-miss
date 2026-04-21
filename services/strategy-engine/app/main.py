"""策略引擎 FastAPI 入口"""
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import profile_router, rules_router, strategy_router
from app.rules.loader import RuleRegistry
from app.services.profile_store import ProfileStore
from app.settings import settings

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("strategy_engine.startup", version="0.1.0")
    app.state.rule_registry = RuleRegistry()
    app.state.rule_registry.load_from_path(settings.rules_path)
    app.state.profile_store = ProfileStore(settings.redis_url)
    await app.state.profile_store.ping()
    yield
    log.info("strategy_engine.shutdown")


app = FastAPI(
    title="Strategy Engine",
    description="豌豆思维数字人 · 策略自适应引擎(PRD 卷五)",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(strategy_router.router, prefix="/api/v1/strategy", tags=["strategy"])
app.include_router(profile_router.router, prefix="/api/v1/profile", tags=["profile"])
app.include_router(rules_router.router, prefix="/api/v1/rules", tags=["rules"])


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "strategy-engine"}
