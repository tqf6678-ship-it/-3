import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.common.exceptions import BizException
from org.fyz.classes import dao


logger = logging.getLogger(__name__)


def get_all():
    """查：所有班级信息"""
    rs = dao.get_all()
    logger.info(f"查：{len(rs)}条班级信息")
    return rs


def get_by_id(class_id):
    """查：一个班级信息"""
    one = dao.get_by_id(class_id)
    if not one:
        raise BizException("班级不存在", code=1000)
    logger.info(f"查：id：{class_id}班级信息")
    return one


def add(name, code, address):
    """增：一个班级信息"""
    if dao.code_exists(code):
        raise BizException("班级编号已存在", code=1001)
    newid = dao.insert_one(name, code, address)
    logger.info(f"增：{newid}条班级信息")
    return newid


def update(class_id, name, code, address):
    """改：一个班级信息"""
    if not dao.get_by_id(class_id):
        raise BizException("班级不存在", code=1000)
    if dao.code_exists(code, class_id):
        raise BizException("班级编号已存在", code=1001)
    rowcount = dao.update(class_id, name, code, address)
    logger.info(f"改：班级信息 id={class_id}")
    return rowcount


def delete(class_id):
    """删：一个班级信息"""
    if not dao.get_by_id(class_id):
        raise BizException("班级不存在", code=1000)

    student_count = dao.count_students(class_id)
    teacher_count = dao.count_teachers(class_id)
    if student_count or teacher_count:
        raise BizException(
            f"该班级下还有 {student_count} 名学生、{teacher_count} 名教师，无法删除",
            code=1001,
        )

    rowcount = dao.delete(class_id)
    logger.info(f"删：班级信息 id={class_id}")
    return rowcount


def get_page(page=1, size=10, keyword=""):
    """查：班级分页列表（keyword 按名称或编号模糊查询）"""
    page = max(1, int(page))
    size = min(max(1, int(size)), MAX_PAGE_SIZE)
    rows, total = dao.get_page(page, size, keyword)
    logger.info(f"分页查：第{page}页 每页{size}条 关键字={keyword} 共{total}条")
    return {"total": total, "page": page, "size": size, "rows": rows}
