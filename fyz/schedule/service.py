import logging

from org.fyz.common.exceptions import BizException
from org.fyz.schedule import dao


logger = logging.getLogger(__name__)


def get_by_class(class_id):
    """查：某个班级的周课表"""
    if not dao.class_exists(class_id):
        raise BizException("班级不存在", code=1000)
    rows = dao.get_by_class(class_id)
    logger.info(f"查：班级{class_id}课表 {len(rows)} 条")
    return rows


def get_by_id(schedule_id):
    """查：一条课表"""
    one = dao.get_by_id(schedule_id)
    if not one:
        raise BizException("课表记录不存在", code=1000)
    logger.info(f"查：课表 id={schedule_id}")
    return one


def _validate_refs(class_id, subject_id, teacher_id):
    if not dao.class_exists(class_id):
        raise BizException("班级不存在", code=1000)
    if not dao.subject_exists(subject_id):
        raise BizException("课程不存在", code=1000)
    if not dao.teacher_exists(teacher_id):
        raise BizException("教师不存在", code=1000)


def _check_conflicts(class_id, teacher_id, weekday, period, exclude_id=0):
    if dao.slot_exists(class_id, weekday, period, exclude_id):
        raise BizException("该班级在这个时间已有课程", code=1001)

    conflict = dao.teacher_conflict(teacher_id, weekday, period, exclude_id)
    if conflict:
        class_name = conflict.get("class_name") or f"班级{conflict.get('class_id')}"
        raise BizException(
            f"该教师在「{class_name}」的同一时间已有课程", code=1001
        )


def add(class_id, subject_id, teacher_id, weekday, period, location):
    """增：一条课表"""
    _validate_refs(class_id, subject_id, teacher_id)
    _check_conflicts(class_id, teacher_id, weekday, period)

    newid = dao.insert_one(
        class_id, subject_id, teacher_id, weekday, period, location
    )
    logger.info(f"增：课表 id={newid} 班级={class_id} 星期{weekday}第{period}节")
    return newid


def update(schedule_id, class_id, subject_id, teacher_id, weekday, period, location):
    """改：一条课表"""
    if not dao.get_by_id(schedule_id):
        raise BizException("课表记录不存在", code=1000)

    _validate_refs(class_id, subject_id, teacher_id)
    _check_conflicts(class_id, teacher_id, weekday, period, exclude_id=schedule_id)

    rowcount = dao.update(
        schedule_id, class_id, subject_id, teacher_id, weekday, period, location
    )
    logger.info(f"改：课表 id={schedule_id}")
    return rowcount


def delete(schedule_id):
    """删：一条课表"""
    if not dao.get_by_id(schedule_id):
        raise BizException("课表记录不存在", code=1000)

    rowcount = dao.delete(schedule_id)
    logger.info(f"删：课表 id={schedule_id}")
    return rowcount
