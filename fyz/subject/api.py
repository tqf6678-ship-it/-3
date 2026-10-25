from pydantic import BaseModel,Field
from fastapi import APIRouter
import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.subject import service
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/sub", tags=["课程管理"])

logger = logging.getLogger(__name__)


@router.get("/all")
def get_all():
    """查：所有课程信息"""
    return ok(service.get_all())


@router.get("/one/{subject_id}")
def get_by_id(subject_id: int):
    """查：一个课程信息"""
    if subject_id <= 0:
        return fail("因参数缺失或者异常，无法查询课程信息")
    return ok(service.get_by_id(subject_id))


class SubjectAdd(BaseModel):
    """新增课程信息的数据结构【数据模型】"""
    name: str = Field(..., min_length=1, max_length=50, description="课程名字")
    sort: str = Field(..., min_length=1, max_length=50, description="课程是否必修")
    points: int = Field(18, ge=0, le=150)



@router.post("/add")
def insert(subjectadd: SubjectAdd):
    """增：一个课程信息"""
    newid = service.add(
        subjectadd.name,
        subjectadd.sort,
        subjectadd.points
    )
    return ok({"id": newid}, "新增课程信息成功")


class SubjectUpdate(BaseModel):
    """修改课程信息的数据结构【数据模型】"""
    subject_id: int
    name: str
    points: int


@router.put("/update")
def update(subjectupdate: SubjectUpdate):
    """改：一个课程信息"""

    service.update(
        subjectupdate.subject_id,
        subjectupdate.name,
        subjectupdate.points
    )
    return ok({"id": subjectupdate.subject_id}, "修改课程信息成功")



@router.delete("/del/{subject_id}")
def delete(subject_id: int):
    """删：一个课程信息"""
    if subject_id <= 0:
        return fail("因参数缺失或者异常，无法删除课程信息")
    service.delete(subject_id)
    return ok(msg=f"删除id为{subject_id}的课程成功")




@router.get("/page")
def get_page(page: int = 1, size: int = 10, keyword: str = ""):
    """查：课程分页列表（keyword 按姓名模糊查询）"""
    if page <= 0:
        return fail("页码必须大于0")

    if size <= 0 or size > MAX_PAGE_SIZE:
        return fail(f"每页条数必须在1~{MAX_PAGE_SIZE}之间")
    return ok(service.get_page(page, size, keyword))


















































