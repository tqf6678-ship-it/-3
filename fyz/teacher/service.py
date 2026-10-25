import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.common.exceptions import BizException
from org.fyz.teacher import dao
from org.fyz.student import dao as student_dao

logger = logging.getLogger(__name__)


def get_all():
    """查：所有老师信息"""
    a = dao.get_all()
    logger.info(f"查：{len(a)}条老师信息")
    return a


def get_by_id(teacher_id):
    """查：一个老师信息"""
    a = dao.get_by_id(teacher_id)
    if not a:
        raise BizException("教师不存在",code = 1000)
    else:
        a["stu"] = student_dao.get_by_teaid(teacher_id)
    logger.info(f"查：{teacher_id}的老师信息")
    return a



def add(name, gender, age, subject, phone, class_id):
    """增：一个老师信息"""
    newid = dao.insert_one(name, gender, age, subject, phone, class_id)
    logger.info(f"增：{newid}条老师信息")
    return newid


def update(teacher_id, name, subject):
    """改：一个老师信息"""
    one = dao.get_by_id(teacher_id)
    if not one:
        raise ValueError("老师不存在")
    rowcount = dao.update(teacher_id, name, subject)
    logger.info(f"改：{teacher_id}条老师信息")
    return rowcount


def get_refs(teacher_id):
    """查：教师删除前的关联数据数量"""
    if not dao.get_by_id(teacher_id):
        raise BizException("教师不存在", code=1000)
    return {
        "students": dao.count_students(teacher_id),
        "schedules": dao.count_schedules(teacher_id),
    }


def delete(teacher_id, replace_teacher_id=0):
    """删：一个老师信息（转移学生、删除排课后删除）"""
    one = dao.get_by_id(teacher_id)
    if not one:
        raise BizException("教师不存在", code=1000)

    student_count = dao.count_students(teacher_id)
    schedule_count = dao.count_schedules(teacher_id)

    if student_count:
        if not replace_teacher_id:
            raise BizException(
                f"该教师名下还有 {student_count} 名学生，请选择接替教师后再删除",
                code=1001,
            )
        if int(replace_teacher_id) == int(teacher_id):
            raise BizException("接替教师不能是当前教师", code=1002)
        if not dao.get_by_id(replace_teacher_id):
            raise BizException("接替教师不存在", code=1000)
    else:
        replace_teacher_id = 0

    dao.delete_with_dependencies(teacher_id, replace_teacher_id)
    logger.info(
        f"删：教师 id={teacher_id}，转移学生 {student_count} 人，删除排课 {schedule_count} 条，"
        f"接替教师={replace_teacher_id or '无'}"
    )
    return {
        "students": student_count,
        "schedules": schedule_count,
        "replaced_to": replace_teacher_id,
    }


def get_page(page=1, size=10, keyword=""):
    """查：教师分页列表（keyword 按姓名模糊查询）"""
    page = max(1, int(page))
    size = min(max(1, int(size)), MAX_PAGE_SIZE)
    rows, total = dao.get_page(page, size, keyword)
    logger.info(f"分页查：第{page}页 每页{size}条 关键字={keyword!r} 共{total}条")
    return {"total": total, "page": page, "size": size, "rows": rows}




































