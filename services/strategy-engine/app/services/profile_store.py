"""画像存储 · MVP Redis 简单版 · GA 对接 Hologres"""
from __future__ import annotations

import redis.asyncio as redis
import structlog

from app.models import ClassProfile, StudentProfile

log = structlog.get_logger()


class ProfileStore:
    """学员/班级画像的读写 · Redis hash 作为热缓存"""

    STUDENT_KEY = "profile:student:{}"
    CLASS_KEY = "profile:class:{}"

    def __init__(self, url: str):
        self.client = redis.from_url(url, decode_responses=True)

    async def ping(self) -> None:
        await self.client.ping()
        log.info("redis.connected")

    async def get_student(self, student_id: str) -> StudentProfile | None:
        raw = await self.client.get(self.STUDENT_KEY.format(student_id))
        if raw is None:
            return None
        return StudentProfile.model_validate_json(raw)

    async def put_student(self, p: StudentProfile, ttl_sec: int = 900) -> None:
        await self.client.set(
            self.STUDENT_KEY.format(p.student_id),
            p.model_dump_json(),
            ex=ttl_sec,
        )

    async def get_class(self, class_id: str) -> ClassProfile | None:
        raw = await self.client.get(self.CLASS_KEY.format(class_id))
        if raw is None:
            return None
        return ClassProfile.model_validate_json(raw)

    async def put_class(self, p: ClassProfile, ttl_sec: int = 900) -> None:
        await self.client.set(
            self.CLASS_KEY.format(p.class_id),
            p.model_dump_json(),
            ex=ttl_sec,
        )

    async def close(self) -> None:
        await self.client.aclose()
