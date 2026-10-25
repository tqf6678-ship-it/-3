from org.fyz.common.basedao import query_all, query_one, execute, insert


def get_by_class(class_id):
    """查询某个班级的全部课表"""
    return query_all(
        """
        SELECT sch.*, c.name AS class_name,
               sub.name AS subject_name, t.name AS teacher_name
        FROM class_schedules sch
        JOIN classes c ON sch.class_id = c.id
        JOIN subjects sub ON sch.subject_id = sub.id
        JOIN teachers t ON sch.teacher_id = t.id
        WHERE sch.class_id = %s
        ORDER BY sch.weekday, sch.period
        """,
        (class_id,),
    )


def get_by_id(schedule_id):
    """查询单条课表"""
    return query_one(
        """
        SELECT sch.*, c.name AS class_name,
               sub.name AS subject_name, t.name AS teacher_name
        FROM class_schedules sch
        JOIN classes c ON sch.class_id = c.id
        JOIN subjects sub ON sch.subject_id = sub.id
        JOIN teachers t ON sch.teacher_id = t.id
        WHERE sch.id = %s
        """,
        (schedule_id,),
    )


def class_exists(class_id):
    return query_one("SELECT id FROM classes WHERE id = %s", (class_id,)) is not None


def subject_exists(subject_id):
    return query_one("SELECT id FROM subjects WHERE id = %s", (subject_id,)) is not None


def teacher_exists(teacher_id):
    return query_one("SELECT id FROM teachers WHERE id = %s", (teacher_id,)) is not None


def slot_exists(class_id, weekday, period, exclude_id=0):
    """同一班级同一时间是否已有课程（排除自身）"""
    return query_one(
        """
        SELECT id FROM class_schedules
        WHERE class_id = %s AND weekday = %s AND period = %s AND id <> %s
        """,
        (class_id, weekday, period, exclude_id),
    ) is not None


def teacher_conflict(teacher_id, weekday, period, exclude_id=0):
    """同一教师同一时间是否已在其他班级排课（排除自身）"""
    return query_one(
        """
        SELECT sch.id, sch.class_id, c.name AS class_name
        FROM class_schedules sch
        LEFT JOIN classes c ON sch.class_id = c.id
        WHERE sch.teacher_id = %s AND sch.weekday = %s
          AND sch.period = %s AND sch.id <> %s
        LIMIT 1
        """,
        (teacher_id, weekday, period, exclude_id),
    )


def insert_one(class_id, subject_id, teacher_id, weekday, period, location):
    """新增一条课表"""
    sql = """
    INSERT INTO class_schedules
        (class_id, subject_id, teacher_id, weekday, period, location)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    return insert(sql, (class_id, subject_id, teacher_id, weekday, period, location))


def update(schedule_id, class_id, subject_id, teacher_id, weekday, period, location):
    """修改一条课表"""
    sql = """
    UPDATE class_schedules
    SET class_id = %s, subject_id = %s, teacher_id = %s,
        weekday = %s, period = %s, location = %s
    WHERE id = %s
    """
    return execute(
        sql,
        (class_id, subject_id, teacher_id, weekday, period, location, schedule_id),
    )


def delete(schedule_id):
    """删除一条课表"""
    return execute("DELETE FROM class_schedules WHERE id = %s", (schedule_id,))


def count_by_class(class_id):
    """统计某个班级的课表数量"""
    return query_one(
        "SELECT COUNT(*) AS c FROM class_schedules WHERE class_id = %s",
        (class_id,),
    )["c"]
