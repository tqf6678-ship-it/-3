from typing import List, Optional

from pydantic import BaseModel, Field
from fastapi import APIRouter
import logging

from org.fyz.score import service
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/sco", tags=["成绩管理"])

logger = logging.getLogger(__name__)


@router.get("/students")
def search_students(
    student_no: str = "",
    name: str = "",
    page: int = 1,
    size: int = 10,
):
    """查：分页搜索学生（学号精准、姓名模糊；不传条件返回全部）"""
    return ok(service.search_students(student_no, name, page, size))


@router.get("/subjects")
def get_student_subjects(student_id: int):
    """查：学生的科目及已有成绩"""
    if student_id <= 0:
        return fail("学生参数不合法")
    return ok(service.get_student_subjects(student_id))


@router.get("/list")
def list_scores(
    student_no: str = "",
    name: str = "",
    class_id: int = 0,
    subject_id: int = 0,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    page: int = 1,
    size: int = 10,
):
    """查：成绩列表（学号、姓名分别模糊筛选，按成绩降序）"""
    if class_id < 0 or subject_id < 0:
        return fail("筛选参数不合法")
    return ok(
        service.list_scores(
            student_no, name, class_id, subject_id, min_score, max_score, page, size
        )
    )


class ScoreItem(BaseModel):
    """单科成绩"""
    subject_id: int = Field(..., ge=1, description="课程ID")
    score: float = Field(..., ge=0, le=150, description="成绩")


class SaveScoresIn(BaseModel):
    """批量保存成绩的数据结构【数据模型】"""
    student_id: int = Field(..., ge=1, description="学生ID")
    scores: List[ScoreItem] = Field(..., min_length=1, description="各科成绩")


@router.post("/save")
def save_scores(data: SaveScoresIn):
    """改：批量保存学生各科成绩"""
    count = service.save_scores(
        data.student_id, [item.model_dump() for item in data.scores]
    )
    return ok({"count": count}, "成绩保存成功")
