from pydantic import BaseModel, Field
from fastapi import APIRouter
import logging

from org.fyz.announcement import service
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/ann", tags=["公告管理"])

logger = logging.getLogger(__name__)


@router.get("/list")
def get_page(
    page: int = 1,
    size: int = 10,
    keyword: str = "",
    status: int = -1,
):
    """查：公告分页列表（status=-1 全部，0 草稿，1 发布）"""
    return ok(service.get_page(page, size, keyword, status))


@router.get("/one/{announcement_id}")
def get_by_id(announcement_id: int):
    """查：一条公告"""
    if announcement_id <= 0:
        return fail("公告参数不合法")
    return ok(service.get_by_id(announcement_id))


class AnnouncementAdd(BaseModel):
    """新增公告的数据结构【数据模型】"""
    title: str = Field(..., min_length=1, max_length=100, description="标题")
    content: str = Field(..., min_length=1, max_length=5000, description="内容")
    status: int = Field(1, ge=0, le=1, description="状态：1发布 0草稿")


@router.post("/add")
def insert(data: AnnouncementAdd):
    """增：一条公告"""
    newid = service.add(data.title, data.content, data.status)
    return ok({"id": newid}, "新增公告成功")


class AnnouncementUpdate(AnnouncementAdd):
    """修改公告的数据结构【数据模型】"""
    announcement_id: int = Field(..., ge=1, description="公告ID")


@router.put("/update")
def update(data: AnnouncementUpdate):
    """改：一条公告"""
    service.update(data.announcement_id, data.title, data.content, data.status)
    return ok({"id": data.announcement_id}, "修改公告成功")


@router.delete("/del/{announcement_id}")
def delete(announcement_id: int):
    """删：一条公告"""
    if announcement_id <= 0:
        return fail("公告参数不合法")
    service.delete(announcement_id)
    return ok(msg=f"删除id为{announcement_id}的公告成功")
