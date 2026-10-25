import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.common.exceptions import BizException
from org.fyz.checkin import dao


logger = logging.getLogger(__name__)


def get_list(class_id=0, status="all", keyword="", page=1, size=100):
    """查：学生报到列表"""
    if status not in ("all", "checked", "unchecked"):
        raise BizException("报到状态参数不合法", code=1002)

    page = max(1, int(page))
    size = min(max(1, int(size)), MAX_PAGE_SIZE)
    rows, total = dao.get_list(class_id, status, keyword, page, size)
    logger.info(
        f"查：报到列表 班级={class_id} 状态={status} 关键字={keyword} 共{total}条"
    )
    return {"total": total, "page": page, "size": size, "rows": rows}


def get_stats(class_id=0, keyword=""):
    """查：报到统计"""
    total, checked = dao.get_stats(class_id, keyword)
    unchecked = max(0, total - checked)
    rate = round(checked / total * 100, 1) if total else 0.0
    return {
        "total": total,
        "checked": checked,
        "unchecked": unchecked,
        "rate": rate,
    }


def checkin(student_id, remark=""):
    """报到：一个学生"""
    if not dao.student_exists(student_id):
        raise BizException("学生不存在", code=1000)
    record = dao.upsert_checkin(student_id, remark)
    logger.info(f"报到：学生 id={student_id}")
    return record


def undo(student_id):
    """撤销报到：一个学生"""
    if not dao.student_exists(student_id):
        raise BizException("学生不存在", code=1000)
    if not dao.get_by_student(student_id):
        raise BizException("该学生尚未报到", code=1000)
    dao.delete_checkin(student_id)
    logger.info(f"撤销报到：学生 id={student_id}")


def checkin_all(class_id, remark=""):
    """报到：一个班级中尚未报到的学生"""
    if not dao.class_exists(class_id):
        raise BizException("班级不存在", code=1000)
    count = dao.checkin_all(class_id, remark)
    logger.info(f"批量报到：班级 id={class_id} 新增 {count} 人")
    return count
