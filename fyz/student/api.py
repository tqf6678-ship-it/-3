from pydantic import Field
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel
from fastapi import APIRouter
import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.student import service
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/stu", tags=["学生管理"])

logger = logging.getLogger(__name__)


@router.get("/all")
def get_all():
    """查：所有学生信息"""
    return ok(service.get_all())


@router.get("/one/{student_id}")
def get_by_id(student_id: int):
    """查：一个学生信息"""
    if student_id <= 0:
        return fail("因参数缺失或者异常，无法查询学生信息")
    return ok(service.get_by_id(student_id))


class StudentAdd(BaseModel):
    """新增学生信息的数据结构【数据模型】"""
    name: str = Field(..., min_length=1, max_length=50, description="学生姓名")
    gender: Literal['男', '女']
    age: int = Field(18, ge=0, le=150, description="学生年龄")
    teacher_id: int = Field(..., ge=0, description="任课老师ID")
    grade: Literal['高一', '高二', '高三']
    enrollment_date: Optional[datetime] = None
    class_id: int


@router.post("/add")
def insert(studentadd: StudentAdd):
    """增：一个学生信息"""
    newid = service.add(
        studentadd.name,
        studentadd.gender,
        studentadd.age,
        studentadd.teacher_id,
        studentadd.grade,
        studentadd.enrollment_date,
        studentadd.class_id
    )
    return ok({"id": newid}, "新增学生信息成功")


class StudentUpdate(BaseModel):
    """修改学生信息的数据结构【数据模型】"""
    student_id: int
    name: str
    age: int
    grade: str


@router.put("/update")
def update(studentupdate: StudentUpdate):
    """改：一个学生信息"""

    service.update(
        studentupdate.student_id,
        studentupdate.name,
        studentupdate.age,
        studentupdate.grade,
    )
    return ok({"id": studentupdate.student_id}, "修改学生信息成功")



@router.delete("/del/{student_id}")
def delete(student_id: int):
    """删：一个学生信息（连同成绩、报到、补充科目）"""
    if student_id <= 0:
        return fail("因参数缺失或者异常，无法删除学生信息")
    result = service.delete(student_id)
    return ok(result, f"删除id为{student_id}的学生成功")




@router.get("/page")
def get_page(page: int = 1, size: int = 10, keyword: str = ""):
    """查：学生分页列表（keyword 按姓名模糊查询）"""
    if page <= 0:
        return fail("页码必须大于0")

    if size <= 0 or size > MAX_PAGE_SIZE:
        return fail(f"每页条数必须在1~{MAX_PAGE_SIZE}之间")
    return ok(service.get_page(page, size, keyword))


@router.get("/subjects/{student_id}")
def get_student_subjects(student_id: int):
    """查：学生的学习科目"""
    if student_id <= 0:
        return fail("因参数缺失或者异常，无法查询学生科目")
    return ok(service.get_student_subjects(student_id))


class StudentSubjectAdd(BaseModel):
    """学生补充科目的数据结构【数据模型】"""
    student_id: int = Field(..., ge=1, description="学生ID")
    subject_id: int = Field(..., ge=1, description="科目ID")


@router.post("/subjects/add")
def add_student_subject(data: StudentSubjectAdd):
    """增：学生补充学习科目"""
    newid = service.add_student_subject(data.student_id, data.subject_id)
    return ok({"id": newid}, "添加科目成功")




















