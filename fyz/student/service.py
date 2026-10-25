import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.common.exceptions import BizException
from org.fyz.student import dao
from org.fyz.teacher import dao as teacher_dao



logger = logging.getLogger(__name__)


def get_all():
    """查：所有学生信息"""
    rs = dao.get_all()
    logger.info(f"查：{len(rs)}条学生信息")
    return rs


def get_by_id(student_id):
    """查：一个学生信息"""
    one = dao.get_by_id(student_id)
    if not one:
        raise BizException("学生不存在",code = 1000)
    one["score"] = dao.get_by_score(student_id)
    logger.info(f"查：学号{student_id}学生信息")
    return one

# print(get_by_id(1))

def add(name, gender, age, teacher_id, grade, enrollment_date, class_id):
    """增：一个学生信息"""
    teaone = teacher_dao.get_by_id(teacher_id)
    if not teaone:
        raise BizException("老师不存在", code=1000)
    newid = dao.insert_one(name, gender, age, teacher_id, grade, enrollment_date, class_id)
    logger.info(f"增：{newid}条学生信息")
    return newid


def update(student_id, name, age, grade):
    """改：一个学生信息"""
    if not dao.get_by_id(student_id):
        raise BizException("学生不存在", code=1000)
    rowcount = dao.update(student_id, name, age, grade)
    logger.info(f"改：学生信息 id={student_id}")
    return rowcount


def delete(student_id):
    """删：一个学生信息（连同成绩、报到、补充科目）"""
    if not dao.get_by_id(student_id):
        raise BizException("学生不存在", code=1000)
    result = dao.delete_with_dependencies(student_id)
    logger.info(
        f"删：学生 id={student_id}，连带删除成绩{result['scores']}条、"
        f"报到{result['checkins']}条、补充科目{result['subjects']}条"
    )
    return result


def get_page(page = 1,size = 10,keyword = ""):
    """查：学生分页列表（keyword按姓名模糊查询）"""
    page = max(1,int(page))
    size = min(max(1,int(size)),MAX_PAGE_SIZE)
    rows,total = dao.get_page(page,size,keyword)
    logger.info(f"分页查：第{page}页 每页{size}条 关键字={keyword} 共{total}条")
    return {"total":total,"page":page, "size":size,"rows":rows}


def get_student_subjects(student_id):
    """查：学生学习科目（班级课表科目 + 手动添加科目）"""
    student = dao.get_by_id(student_id)
    if not student:
        raise BizException("学生不存在", code=1000)

    scheduled = (
        dao.get_class_scheduled_subjects(student["class_id"])
        if student.get("class_id")
        else []
    )
    manual = dao.get_manual_subjects(student_id)

    subjects = []
    seen = set()
    for row in scheduled:
        subjects.append(
            {
                "subject_id": row["subject_id"],
                "subject_name": row["subject_name"],
                "teacher_names": row.get("teacher_names") or "",
                "source": "schedule",
            }
        )
        seen.add(row["subject_id"])

    for row in manual:
        if row["subject_id"] in seen:
            continue
        subjects.append(
            {
                "subject_id": row["subject_id"],
                "subject_name": row["subject_name"],
                "teacher_names": "",
                "source": "manual",
                "create_time": row.get("create_time"),
            }
        )

    logger.info(f"查：学生{student_id}学习科目 {len(subjects)} 门")
    return {
        "student": {
            "id": student["id"],
            "name": student["name"],
            "grade": student.get("grade"),
            "class_id": student.get("class_id"),
        },
        "subjects": subjects,
    }


def add_student_subject(student_id, subject_id):
    """增：学生补充学习科目"""
    student = dao.get_by_id(student_id)
    if not student:
        raise BizException("学生不存在", code=1000)
    if not dao.subject_exists(subject_id):
        raise BizException("科目不存在", code=1000)

    if student.get("class_id") and dao.is_subject_in_class_schedule(
        student["class_id"], subject_id
    ):
        raise BizException("该科目已在班级课表中，无需重复添加", code=1001)
    if dao.student_subject_exists(student_id, subject_id):
        raise BizException("该科目已添加", code=1001)

    newid = dao.insert_student_subject(student_id, subject_id)
    logger.info(f"增：学生{student_id}补充科目 subject_id={subject_id}")
    return newid
















