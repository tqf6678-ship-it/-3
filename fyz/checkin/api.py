from pydantic import BaseModel, Field
from fastapi import APIRouter
import logging

from org.fyz.checkin import service
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/chk", tags=["学生报到"])

logger = logging.getLogger(__name__)


@router.get("/list")
def get_list(
    class_id: int = 0,
    status: str = "all",
    keyword: str = "",
    page: int = 1,
    size: int = 100,
):
    """查：学生报到列表"""
    if class_id < 0:
        return fail("班级参数不合法")
    return ok(service.get_list(class_id, status, keyword, page, size))


@router.get("/stats")
def get_stats(class_id: int = 0, keyword: str = ""):
    """查：报到统计"""
    if class_id < 0:
        return fail("班级参数不合法")
    return ok(service.get_stats(class_id, keyword))


class CheckinIn(BaseModel):
    """学生报到的数据结构【数据模型】"""
    student_id: int = Field(..., ge=1, description="学生ID")
    remark: str = Field("", max_length=200, description="备注")


@router.post("/checkin")
def checkin(data: CheckinIn):
    """操作：单个学生报到"""
    record = service.checkin(data.student_id, data.remark)
    return ok(
        {
            "student_id": data.student_id,
            "checkin_time": record["checkin_time"] if record else None,
        },
        "报到成功",
    )


class UndoIn(BaseModel):
    """撤销报到的数据结构【数据模型】"""
    student_id: int = Field(..., ge=1, description="学生ID")


@router.post("/undo")
def undo(data: UndoIn):
    """操作：撤销单个学生报到"""
    service.undo(data.student_id)
    return ok(msg="已撤销报到")


class CheckinAllIn(BaseModel):
    """按班级批量报到的数据结构【数据模型】"""
    class_id: int = Field(..., ge=1, description="班级ID")
    remark: str = Field("", max_length=200, description="备注")


@router.post("/checkin-all")
def checkin_all(data: CheckinAllIn):
    """操作：按班级批量报到"""
    count = service.checkin_all(data.class_id, data.remark)
    return ok({"count": count}, f"已完成 {count} 名学生的报到")
