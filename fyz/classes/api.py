from pydantic import BaseModel, Field
from fastapi import APIRouter
import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.classes import service
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/cls", tags=["班级管理"])

logger = logging.getLogger(__name__)


@router.get("/all")
def get_all():
    """查：所有班级信息"""
    return ok(service.get_all())


@router.get("/one/{class_id}")
def get_by_id(class_id: int):
    """查：一个班级信息"""
    if class_id <= 0:
        return fail("因参数缺失或异常，无法查询班级信息")
    return ok(service.get_by_id(class_id))


class ClassAdd(BaseModel):
    """新增班级信息的数据结构【数据模型】"""
    name: str = Field(..., min_length=1, max_length=50, description="班级名称")
    code: str = Field(..., min_length=1, max_length=50, description="班级编号")
    address: str = Field("", max_length=200, description="班级地址")


@router.post("/add")
def insert(classadd: ClassAdd):
    """增：一个班级信息"""
    newid = service.add(classadd.name, classadd.code, classadd.address)
    return ok({"id": newid}, "新增班级信息成功")


class ClassUpdate(BaseModel):
    """修改班级信息的数据结构【数据模型】"""
    class_id: int
    name: str = Field(..., min_length=1, max_length=50, description="班级名称")
    code: str = Field(..., min_length=1, max_length=50, description="班级编号")
    address: str = Field("", max_length=200, description="班级地址")


@router.put("/update")
def update(classupdate: ClassUpdate):
    """改：一个班级信息"""
    service.update(
        classupdate.class_id,
        classupdate.name,
        classupdate.code,
        classupdate.address,
    )
    return ok({"id": classupdate.class_id}, "修改班级信息成功")


@router.delete("/del/{class_id}")
def delete(class_id: int):
    """删：一个班级信息"""
    if class_id <= 0:
        return fail("因参数缺失或异常，无法删除班级信息")
    service.delete(class_id)
    return ok(msg=f"删除id为{class_id}的班级成功")


@router.get("/page")
def get_page(page: int = 1, size: int = 10, keyword: str = ""):
    """查：班级分页列表（keyword 按名称或编号模糊查询）"""
    if page <= 0:
        return fail("页码必须大于0")

    if size <= 0 or size > MAX_PAGE_SIZE:
        return fail(f"每页条数必须在1~{MAX_PAGE_SIZE}之间")
    return ok(service.get_page(page, size, keyword))
