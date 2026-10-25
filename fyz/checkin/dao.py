from org.fyz.common.basedao import query_all, query_one, execute


def student_exists(student_id):
    return query_one("SELECT id FROM students WHERE id = %s", (student_id,)) is not None


def class_exists(class_id):
    return query_one("SELECT id FROM classes WHERE id = %s", (class_id,)) is not None


def get_by_student(student_id):
    return query_one(
        "SELECT * FROM student_checkins WHERE student_id = %s", (student_id,)
    )


def get_list(class_id=0, status="all", keyword="", page=1, size=100):
    """分页查询学生报到列表，返回（当前页数据，总条数）"""
    where, args = [], []
    if class_id:
        where.append("s.class_id = %s")
        args.append(class_id)
    if keyword:
        where.append("s.name LIKE %s")
        args.append(f"%{keyword}%")
    if status == "checked":
        where.append("ci.id IS NOT NULL")
    elif status == "unchecked":
        where.append("ci.id IS NULL")
    clause = (" WHERE " + " AND ".join(where)) if where else ""

    total_row = query_one(
        f"""
        SELECT COUNT(*) AS total
        FROM students s
        LEFT JOIN student_checkins ci ON ci.student_id = s.id
        {clause}
        """,
        args or None,
    )
    total = int(total_row["total"]) if total_row else 0

    rows = query_all(
        f"""
        SELECT s.id, s.name, s.gender, s.age, s.grade, s.class_id,
               c.name AS class_name, t.name AS teacher_name,
               ci.checkin_time, ci.remark,
               CASE WHEN ci.id IS NULL THEN 0 ELSE 1 END AS checked_in
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN teachers t ON s.teacher_id = t.id
        LEFT JOIN student_checkins ci ON ci.student_id = s.id
        {clause}
        ORDER BY s.class_id, s.id
        LIMIT %s OFFSET %s
        """,
        [*args, size, (page - 1) * size],
    )
    return rows, total


def get_stats(class_id=0, keyword=""):
    """统计应到/已到人数"""
    where, args = [], []
    if class_id:
        where.append("s.class_id = %s")
        args.append(class_id)
    if keyword:
        where.append("s.name LIKE %s")
        args.append(f"%{keyword}%")
    clause = (" WHERE " + " AND ".join(where)) if where else ""

    row = query_one(
        f"""
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN ci.id IS NULL THEN 0 ELSE 1 END) AS checked
        FROM students s
        LEFT JOIN student_checkins ci ON ci.student_id = s.id
        {clause}
        """,
        args or None,
    )
    total = int(row["total"] or 0) if row else 0
    checked = int(row["checked"] or 0) if row else 0
    return total, checked


def upsert_checkin(student_id, remark):
    """报到：已有记录则更新时间和备注，否则新增"""
    sql = """
    INSERT INTO student_checkins (student_id, checkin_time, remark)
    VALUES (%s, CURRENT_TIMESTAMP, %s)
    ON DUPLICATE KEY UPDATE checkin_time = CURRENT_TIMESTAMP, remark = %s
    """
    execute(sql, (student_id, remark, remark))
    return get_by_student(student_id)


def delete_checkin(student_id):
    """撤销报到"""
    return execute("DELETE FROM student_checkins WHERE student_id = %s", (student_id,))


def checkin_all(class_id, remark=""):
    """按班级批量报到：只处理尚未报到的学生"""
    sql = """
    INSERT INTO student_checkins (student_id, remark)
    SELECT s.id, %s
    FROM students s
    LEFT JOIN student_checkins ci ON ci.student_id = s.id
    WHERE s.class_id = %s AND ci.id IS NULL
    """
    return execute(sql, (remark, class_id))
