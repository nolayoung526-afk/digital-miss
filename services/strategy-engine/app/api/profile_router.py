"""画像查询/写入接口"""
from fastapi import APIRouter, HTTPException, Request

from app.models import ClassProfile, StudentProfile

router = APIRouter()


@router.get("/student/{student_id}", response_model=StudentProfile, summary="查学员画像")
async def get_student(student_id: str, request: Request) -> StudentProfile:
    store = request.app.state.profile_store
    p = await store.get_student(student_id)
    if p is None:
        raise HTTPException(404, f"profile not found: {student_id}")
    return p


@router.put("/student", summary="写入学员画像(T+1 管道)")
async def put_student(profile: StudentProfile, request: Request) -> dict:
    store = request.app.state.profile_store
    await store.put_student(profile)
    return {"ok": True, "student_id": profile.student_id}


@router.put("/class", summary="写入班级画像")
async def put_class(profile: ClassProfile, request: Request) -> dict:
    store = request.app.state.profile_store
    await store.put_class(profile)
    return {"ok": True, "class_id": profile.class_id}
