from pydantic import Field
from typing import Literal

from org.fyz.teacher import service
from pydantic import BaseModel
from fastapi import APIRouter
import logging
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/tea", tags=["老师管理"])

logger = logging.getLogger(__name__)


@router.get("/all")
def get_all():
    """查：所有老师信息"""
    return ok(service.get_all())


@router.get("/one/{teacher_id}")
def get_by_id(teacher_id: int):
    """查：一个老师信息"""
    if teacher_id <= 0:
        return fail("因参数缺失或异常，无法查询老师信息")
    return ok(service.get_by_id(teacher_id))


class TeacherAdd(BaseModel):
    """新增老师信息的数据结构【数据模型】"""
    name: str = Field(..., min_length=1, max_length=50, description="老师姓名")
    gender: Literal['男', '女']
    age: int = Field(18, ge=0, le=150, description="老师年龄")
    subject: str = Field(..., min_length=1, max_length=10, description="教授科目")
    phone: str = Field(..., min_length=1, max_length=12, description="老师电话号码")
    class_id: int


@router.post("/add")
def insert(teacheradd: TeacherAdd):
    """增：一个老师信息"""
    newid = service.add(
        teacheradd.name,
        teacheradd.gender,
        teacheradd.age,
        teacheradd.subject,
        teacheradd.phone,
        teacheradd.class_id
    )
    return ok({"id": newid}, "新增老师信息成功")


class TeacherUpdate(BaseModel):
    """修改老师信息的数据结构【数据模型】"""
    teacher_id: int
    name: str
    subject: str


@router.put("/update")
def update(teacherupdate: TeacherUpdate):
    """改：一个老师信息"""
    try:
        service.update(
            teacherupdate.teacher_id,
            teacherupdate.name,
            teacherupdate.subject
        )
        return ok({"teacher_id": teacherupdate.teacher_id}, "修改老师信息成功")
    except Exception as e:
        logger.error(f"改：一个老师信息异常，异常信息为：{e}")
        return fail("修改老师信息失败")


@router.get("/refs/{teacher_id}")
def get_refs(teacher_id: int):
    """查：删除教师前的学生数、排课数"""
    if teacher_id <= 0:
        return fail("因参数缺失或者异常，无法查询教师关联数据")
    return ok(service.get_refs(teacher_id))


@router.delete("/del/{teacher_id}")
def delete(teacher_id: int, replace_teacher_id: int = 0):
    """删：一个老师信息（可指定接替教师）"""
    if teacher_id <= 0:
        return fail("因参数缺失或者异常，无法删除老师信息")
    result = service.delete(teacher_id, replace_teacher_id)
    return ok(result, "删除老师信息成功")













