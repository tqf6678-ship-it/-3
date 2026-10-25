import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.common.exceptions import BizException
from org.fyz.subject import dao



logger = logging.getLogger(__name__)


def get_all():
    """查：所有课程信息"""
    rs = dao.get_all()
    logger.info(f"查：{len(rs)}条课程信息")
    return rs


def get_by_id(subject_id):
    """查：一个课程信息"""
    one = dao.get_by_id(subject_id)
    logger.info(f"查：id：{subject_id}课程信息")
    if not one:
        raise BizException("课程不存在", code=1000)
    return one



def add(name, sort, points):
    """增：一个课程信息"""
    newid = dao.insert_one(name, sort, points)
    logger.info(f"增：{newid}条课程信息")
    return newid


def update(subject_id, name, points):
    """改：一个课程信息"""
    if not dao.get_by_id(subject_id):
        raise BizException("课程不存在", code=1000)
    rowcount = dao.update(subject_id, name, points)
    logger.info(f"改：课程信息 id={subject_id}")
    return rowcount


def delete(subject_id):
    """删：一个课程信息"""
    if not dao.get_by_id(subject_id):
        raise BizException("课程不存在", code=1000)
    rowcount = dao.delete(subject_id)
    logger.info(f"删：课程信息 id={subject_id}")
    return rowcount


def get_page(page = 1,size = 10,keyword = ""):
    """查：课程分页列表（keyword按姓名模糊查询）"""
    page = max(1,int(page))
    size = min(max(1,int(size)),MAX_PAGE_SIZE)
    rows,total = dao.get_page(page,size,keyword)
    logger.info(f"分页查：第{page}页 每页{size}条 关键字={keyword} 共{total}条")
    return {"total":total,"page":page, "size":size,"rows":rows}
















