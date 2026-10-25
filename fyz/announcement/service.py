import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.common.exceptions import BizException
from org.fyz.announcement import dao

logger = logging.getLogger(__name__)


def get_page(page=1, size=10, keyword="", status=-1):
    """查：公告分页列表"""
    if status not in (-1, 0, 1):
        raise BizException("公告状态参数不合法", code=1002)

    page = max(1, int(page))
    size = min(max(1, int(size)), MAX_PAGE_SIZE)
    rows, total = dao.get_page(page, size, keyword, status)
    logger.info(
        f"分页查：公告 第{page}页 每页{size}条 关键字={keyword} 状态={status} 共{total}条"
    )
    return {"total": total, "page": page, "size": size, "rows": rows}


def get_by_id(announcement_id):
    one = dao.get_by_id(announcement_id)
    if not one:
        raise BizException("公告不存在", code=1000)
    return one


def add(title, content, status):
    newid = dao.insert_one(title, content, status)
    logger.info(f"增：公告 id={newid} 标题={title}")
    return newid


def update(announcement_id, title, content, status):
    if not dao.get_by_id(announcement_id):
        raise BizException("公告不存在", code=1000)
    rowcount = dao.update(announcement_id, title, content, status)
    logger.info(f"改：公告 id={announcement_id}")
    return rowcount


def delete(announcement_id):
    if not dao.get_by_id(announcement_id):
        raise BizException("公告不存在", code=1000)
    rowcount = dao.delete(announcement_id)
    logger.info(f"删：公告 id={announcement_id}")
    return rowcount
