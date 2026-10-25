import logging

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.common.exceptions import BizException
from org.fyz.score import dao


logger = logging.getLogger(__name__)


def fmt_score(value):
    number = float(value)
    return str(int(number)) if number.is_integer() else f"{number:g}"


def _parse_student_no(student_no):
    """学号精准查询：必须是正整数"""
    student_no = (student_no or "").strip()
    if not student_no:
        return 0
    try:
        value = int(student_no)
    except ValueError:
        raise BizException("学号必须是数字", code=1002)
    if value < 1:
        raise BizException("学号必须是正整数", code=1002)
    return value


def search_students(student_no="", name="", page=1, size=10):
    """查：按学号精准、姓名模糊分页搜索学生；无条件时返回全部"""
    name = (name or "").strip()
    student_no_value = _parse_student_no(student_no)
    page = max(1, int(page))
    size = min(max(1, int(size)), MAX_PAGE_SIZE)

    rows, total = dao.search_students(student_no_value, name, page, size)
    logger.info(
        f"查：成绩学生搜索 学号={student_no_value or '无'} 姓名={name} "
        f"第{page}页 每页{size}条 共{total}条"
    )
    return {"total": total, "page": page, "size": size, "rows": rows}


def get_student_subjects(student_id):
    """查：学生的科目列表和已有成绩"""
    student = dao.get_student(student_id)
    if not student:
        raise BizException("学生不存在", code=1000)

    scheduled = (
        dao.get_scheduled_subjects(student["class_id"]) if student["class_id"] else []
    )
    scored = dao.get_scored_subjects(student_id)

    subjects = {}
    for row in scheduled:
        subjects[row["subject_id"]] = {
            "subject_id": row["subject_id"],
            "subject_name": row["subject_name"],
            "teacher_names": row.get("teacher_names") or "",
        }
    for row in scored:
        if row["subject_id"] not in subjects:
            subjects[row["subject_id"]] = {
                "subject_id": row["subject_id"],
                "subject_name": row["subject_name"],
                "teacher_names": "",
            }

    for row in dao.get_manual_subjects(student_id):
        if row["subject_id"] not in subjects:
            subjects[row["subject_id"]] = {
                "subject_id": row["subject_id"],
                "subject_name": row["subject_name"],
                "teacher_names": "",
            }

    if not subjects:
        for row in dao.get_all_subjects():
            subjects[row["subject_id"]] = {
                "subject_id": row["subject_id"],
                "subject_name": row["subject_name"],
                "teacher_names": "",
            }

    latest = {
        row["subject_id"]: row for row in dao.get_latest_scores(student_id)
    }

    result = []
    for subject_id in sorted(subjects):
        item = subjects[subject_id]
        score = latest.get(subject_id)
        score_value = score["score"] if score else None
        try:
            score_num = float(score_value) if score_value not in (None, "") else None
        except (TypeError, ValueError):
            score_num = None

        item["score_id"] = score["score_id"] if score else None
        item["score"] = score_value
        item["score_num"] = score_num
        result.append(item)

    logger.info(f"查：学生{student_id}科目 {len(result)} 门")
    return {"student": student, "subjects": result}


def list_scores(student_no="", name="", class_id=0, subject_id=0,
                min_score=None, max_score=None, page=1, size=10):
    """查：成绩列表（按成绩降序）"""
    page = max(1, int(page))
    size = min(max(1, int(size)), MAX_PAGE_SIZE)

    if min_score is not None and max_score is not None and min_score > max_score:
        raise BizException("最低分不能大于最高分", code=1002)

    student_no_value = _parse_student_no(student_no)
    rows, total = dao.list_scores(
        student_no_value, name, class_id, subject_id, min_score, max_score, page, size
    )
    logger.info(
        f"查：成绩列表 学号={student_no_value or '无'} 姓名={name} 班级={class_id} "
        f"科目={subject_id} 分数={min_score}-{max_score} 共{total}条"
    )
    return {"total": total, "page": page, "size": size, "rows": rows}


def save_scores(student_id, scores):
    """改：批量保存学生各科成绩"""
    if not dao.get_student(student_id):
        raise BizException("学生不存在", code=1000)
    if not scores:
        raise BizException("没有可保存的成绩", code=1002)

    items = {}
    for item in scores:
        subject_id = int(item["subject_id"])
        score = float(item["score"])
        if score < 0 or score > 150:
            raise BizException("成绩需在 0-150 之间", code=1002)
        if not dao.subject_exists(subject_id):
            raise BizException(f"课程不存在（ID {subject_id}）", code=1000)
        items[subject_id] = fmt_score(score)

    count = dao.save_many(student_id, list(items.items()))
    logger.info(f"改：学生{student_id}成绩 {count} 门")
    return count
