from org.fyz.common.basedao import query_all,query_one,execute,insert
from org.fyz.common.pool import get_conn

def get_all(teacher_id = 0):
    """查询所有学生信息"""
    where, args ="", []
    if teacher_id >= 0:
        where = "where teacher_id= %s"
        args.append(f"{teacher_id}")
    rows = query_all(
        f"SELECT * FROM students {where} ORDER BY id",
        [*args]
    )
    return rows


def get_by_teaid(teacher_id):
    return query_all("SELECT * FROM students WHERE teacher_id= %s ORDER BY id", (teacher_id,))


def get_by_id(student_id: int):
    """查询单个学生信息"""
    return query_one("SELECT * FROM students WHERE id = %s", (student_id,))

def get_by_score(student_id: int):
    return query_all("SELECT * FROM score WHERE student_id = %s ORDER BY id", (student_id,))

# print(get_by_score(1))

def insert_one(name, gender, age, teacher_id, grade, enrollment_date,class_id):
    """新增一个学生信息"""
    sql = """
    INSERT INTO students (name,gender,age,teacher_id,grade,enrollment_date, class_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    return insert(sql,(name,gender,age,teacher_id,grade,enrollment_date, class_id))


def update(student_id, name, age, grade):
    """更改一个学生信息"""
    sql = """
    UPDATE students set name = %s,age = %s,grade = %s WHERE id = %s
    """
    return execute(sql,(name,age,grade,student_id))

def delete(student_id):
    """删除一个学生"""
    return execute("DELETE FROM students WHERE id = %s", (student_id,))


def delete_with_dependencies(student_id):
    """事务删除学生及其成绩、报到记录、补充科目"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM score WHERE student_id = %s", (student_id,))
            score_count = cur.rowcount

            cur.execute(
                "DELETE FROM student_checkins WHERE student_id = %s", (student_id,)
            )
            checkin_count = cur.rowcount

            cur.execute(
                "DELETE FROM student_subjects WHERE student_id = %s", (student_id,)
            )
            subject_count = cur.rowcount

            cur.execute("DELETE FROM students WHERE id = %s", (student_id,))
            student_count = cur.rowcount

        conn.commit()
        return {
            "students": student_count,
            "scores": score_count,
            "checkins": checkin_count,
            "subjects": subject_count,
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def get_page(page, size, keyword = ""):
    """分页查询：按姓名模糊搜索，返回（当前页数据，总条数"""
    where, args = "",[]
    if keyword:
        where = " WHERE name LIKE %s"
        args.append(f"%{keyword}%")

    total = query_one(f"SELECT COUNT(*) AS total FROM students {where}", args or None)["total"]

    rows = query_all(
        f"SELECT * FROM students {where} ORDER BY id LIMIT %s OFFSET %s",
        [*args, size, (page-1)*size]
        )
    return rows,total


def get_class_scheduled_subjects(class_id):
    """查询班级课表中的科目及任课教师"""
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


def get_manual_subjects(student_id):
    """查询学生手动添加的科目"""
    return query_all(
        """
        SELECT ss.subject_id, sub.name AS subject_name, ss.create_time
        FROM student_subjects ss
        JOIN subjects sub ON ss.subject_id = sub.id
        WHERE ss.student_id = %s
        ORDER BY ss.subject_id
        """,
        (student_id,),
    )


def subject_exists(subject_id):
    return query_one("SELECT id FROM subjects WHERE id = %s", (subject_id,)) is not None


def is_subject_in_class_schedule(class_id, subject_id):
    return query_one(
        "SELECT id FROM class_schedules WHERE class_id = %s AND subject_id = %s LIMIT 1",
        (class_id, subject_id),
    ) is not None


def student_subject_exists(student_id, subject_id):
    return query_one(
        "SELECT id FROM student_subjects WHERE student_id = %s AND subject_id = %s",
        (student_id, subject_id),
    ) is not None


def insert_student_subject(student_id, subject_id):
    """新增学生补充科目"""
    return insert(
        "INSERT INTO student_subjects (student_id, subject_id) VALUES (%s, %s)",
        (student_id, subject_id),
    )











































