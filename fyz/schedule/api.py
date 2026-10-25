from pydantic import BaseModel, Field
from fastapi import APIRouter
import logging

from org.fyz.schedule import service
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/sch", tags=["课表管理"])

logger = logging.getLogger(__name__)


@router.get("/list")
def get_by_class(class_id: int):
    """查：某个班级的周课表"""
    if class_id <= 0:
        return fail("因参数缺失或异常，无法查询课表")
    return ok(service.get_by_class(class_id))


@router.get("/one/{schedule_id}")
def get_one(schedule_id: int):
    """查：一条课表"""
    if schedule_id <= 0:
        return fail("因参数缺失或异常，无法查询课表")
    return ok(service.get_by_id(schedule_id))


class ScheduleAdd(BaseModel):
    """新增课表的数据结构【数据模型】"""
    class_id: int = Field(..., ge=1, description="班级ID")
    subject_id: int = Field(..., ge=1, description="课程ID")
    teacher_id: int = Field(..., ge=1, description="教师ID")
    weekday: int = Field(..., ge=1, le=7, description="星期（1-7）")
    period: int = Field(..., ge=1, le=8, description="节次（1-8）")
    location: str = Field("", max_length=100, description="上课地点")


@router.post("/add")
def insert(data: ScheduleAdd):
    """增：一条课表"""
    newid = service.add(
        data.class_id,
        data.subject_id,
        data.teacher_id,
        data.weekday,
        data.period,
        data.location,
    )
    return ok({"id": newid}, "新增课表成功")


class ScheduleUpdate(ScheduleAdd):
    """修改课表的数据结构【数据模型】"""
    schedule_id: int = Field(..., ge=1, description="课表ID")


@router.put("/update")
def update(data: ScheduleUpdate):
    """改：一条课表"""
    service.update(
        data.schedule_id,
        data.class_id,
        data.subject_id,
        data.teacher_id,
        data.weekday,
        data.period,
        data.location,
    )
    return ok({"id": data.schedule_id}, "修改课表成功")


@router.delete("/del/{schedule_id}")
def delete(schedule_id: int):
    """删：一条课表"""
    if schedule_id <= 0:
        return fail("因参数缺失或异常，无法删除课表")
    service.delete(schedule_id)
    return ok(msg=f"删除id为{schedule_id}的课表成功")
