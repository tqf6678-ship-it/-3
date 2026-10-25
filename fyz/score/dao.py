from org.fyz.common.basedao import query_all, query_one
from org.fyz.common.pool import get_conn


def search_students(student_no=0, name="", page=1, size=10):
    """按学号精准、姓名模糊分页查询学生；无条件时返回全部"""
    name = (name or "").strip()

    where, args = [], []
    if student_no:
        where.append("s.id = %s")
        args.append(int(student_no))
    if name:
        where.append("s.name LIKE %s")
        args.append(f"%{name}%")

    clause = (" WHERE " + " AND ".join(where)) if where else ""

    total = query_one(
        f"SELECT COUNT(*) AS total FROM students s{clause}", args or None
    )["total"]

    rows = query_all(
        f"""
        SELECT s.id, s.name, s.gender, s.grade, s.class_id,
               c.name AS class_name, t.name AS teacher_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN teachers t ON s.teacher_id = t.id
        {clause}
        ORDER BY s.id
        LIMIT %s OFFSET %s
        """,
        [*args, size, (page - 1) * size],
    )
    return rows, int(total)


def get_student(student_id):
    return query_one(
        """
        SELECT s.id, s.name, s.gender, s.grade, s.class_id,
               c.name AS class_name, t.name AS teacher_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN teachers t ON s.teacher_id = t.id
        WHERE s.id = %s
        """,
        (student_id,),
    )


def get_scheduled_subjects(class_id):
    """从班级课表中取出该班学习的科目及任课教师"""
    return query_all(
        """
        SELECT sch.subject_id, sub.name AS subject_name,
               GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR '、') AS teacher_names
        FROM class_schedules sch
        JOIN subjects sub ON sch.subject_id = sub.id
        JOIN teachers t ON sch.teacher_id = t.id
        WHERE sch.class_id = %s
        GROUP BY sch.subject_id, sub.name
        ORDER BY sch.subject_id
        """,
        (class_id,),
    )


def get_scored_subjects(student_id):
    """该学生已有成绩的科目"""
    return query_all(
        """
        SELECT DISTINCT sub.id AS subject_id, sub.name AS subject_name
        FROM score sc
        JOIN subjects sub ON sc.subject_id = sub.id
        WHERE sc.student_id = %s
        ORDER BY sub.id
        """,
        (student_id,),
    )


def get_latest_scores(student_id):
    """每个科目取最新一条成绩"""
    return query_all(
        """
        SELECT sc.id AS score_id, sc.subject_id, sc.score
        FROM score sc
        JOIN (
            SELECT subject_id, MAX(id) AS max_id
            FROM score
            WHERE student_id = %s
            GROUP BY subject_id
        ) latest ON sc.id = latest.max_id
        """,
        (student_id,),
    )


def get_all_subjects():
    """没有课表时的兜底科目列表"""
    return query_all(
        "SELECT id AS subject_id, name AS subject_name FROM subjects ORDER BY id"
    )


def subject_exists(subject_id):
    return query_one("SELECT id FROM subjects WHERE id = %s", (subject_id,)) is not None


def get_manual_subjects(student_id):
    """学生在学生管理页手动添加的科目"""
    return query_all(
        """
        SELECT ss.subject_id, sub.name AS subject_name
        FROM student_subjects ss
        JOIN subjects sub ON ss.subject_id = sub.id
        WHERE ss.student_id = %s
        ORDER BY ss.subject_id
        """,
        (student_id,),
    )


def list_scores(student_no=0, name="", class_id=0, subject_id=0,
                min_score=None, max_score=None, page=1, size=10):
    """成绩查询：学号精准、姓名模糊、班级/科目/分数区间筛选，成绩降序"""
    where, args = [], []

    name = (name or "").strip()

    if student_no:
        where.append("s.id = %s")
        args.append(int(student_no))
    if name:
        where.append("s.name LIKE %s")
        args.append(f"%{name}%")
    if class_id:
        where.append("s.class_id = %s")
        args.append(class_id)
    if subject_id:
        where.append("sc.subject_id = %s")
        args.append(subject_id)
    if min_score is not None:
        where.append("CAST(sc.score AS DECIMAL(10, 2)) >= %s")
        args.append(min_score)
    if max_score is not None:
        where.append("CAST(sc.score AS DECIMAL(10, 2)) <= %s")
        args.append(max_score)

    clause = (" WHERE " + " AND ".join(where)) if where else ""

    total = query_one(
        f"""
        SELECT COUNT(*) AS total
        FROM score sc
        JOIN students s ON sc.student_id = s.id
        JOIN subjects sub ON sc.subject_id = sub.id
        {clause}
        """,
        args or None,
    )["total"]

    rows = query_all(
        f"""
        SELECT sc.id, sc.student_id, s.name AS student_name, s.grade, s.class_id,
               c.name AS class_name, sc.subject_id, sub.name AS subject_name,
               sc.score, CAST(sc.score AS DECIMAL(10, 2)) AS score_num
        FROM score sc
        JOIN students s ON sc.student_id = s.id
        JOIN subjects sub ON sc.subject_id = sub.id
        LEFT JOIN classes c ON s.class_id = c.id
        {clause}
        ORDER BY score_num DESC, sc.id DESC
        LIMIT %s OFFSET %s
        """,
        [*args, size, (page - 1) * size],
    )
    return rows, total


def save_many(student_id, items):
    """批量保存成绩：同一学生同一科目更新最新记录，否则新增"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            for subject_id, score_text in items:
                cur.execute(
                    """
                    SELECT id FROM score
                    WHERE student_id = %s AND subject_id = %s
                    ORDER BY id DESC LIMIT 1
                    """,
                    (student_id, subject_id),
                )
                row = cur.fetchone()
                if row:
                    cur.execute(
                        "UPDATE score SET score = %s WHERE id = %s",
                        (score_text, row["id"]),
                    )
                else:
                    cur.execute(
                        "INSERT INTO score (student_id, subject_id, score) VALUES (%s, %s, %s)",
                        (student_id, subject_id, score_text),
                    )
        conn.commit()
        return len(items)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
