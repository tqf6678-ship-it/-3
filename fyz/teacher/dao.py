from org.fyz.common.basedao import query_all,query_one,execute,insert
from org.fyz.common.pool import get_conn

def get_all():
    """查询所有老师信息"""
    return query_all("SELECT * FROM teachers ORDER BY id")


def get_by_id(teacher_id: int):
    """查询单个老师信息"""
    return query_one("SELECT * FROM teachers WHERE id = %s", (teacher_id,))


def insert_one(name, gender, age, subject, phone, class_id):
    """新增一个老师信息"""
    sql = """
    INSERT INTO teachers (name, gender, age, subject, phone, class_id)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    return insert(sql,(name, gender, age, subject, phone, class_id))


def update(teacher_id, name, subject):
    """更改一个老师信息"""
    sql = """
    UPDATE teachers set name = %s,subject = %s WHERE id = %s
    """
    return execute(sql,(name, subject, teacher_id))

def delete(teacher_id):
    """删除一个老师"""
    return execute("DELETE FROM teachers WHERE id = %s", (teacher_id,))


def count_students(teacher_id):
    """统计教师名下学生数"""
    return query_one(
        "SELECT COUNT(*) AS c FROM students WHERE teacher_id = %s", (teacher_id,)
    )["c"]


def count_schedules(teacher_id):
    """统计教师的排课记录数"""
    return query_one(
        "SELECT COUNT(*) AS c FROM class_schedules WHERE teacher_id = %s", (teacher_id,)
    )["c"]


def delete_with_dependencies(teacher_id, replace_teacher_id=0):
    """事务删除教师：转移学生 → 删除排课 → 删除教师"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if replace_teacher_id:
                cur.execute(
                    "UPDATE students SET teacher_id = %s WHERE teacher_id = %s",
                    (replace_teacher_id, teacher_id),
                )
            cur.execute(
                "DELETE FROM class_schedules WHERE teacher_id = %s", (teacher_id,)
            )
            cur.execute("DELETE FROM teachers WHERE id = %s", (teacher_id,))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def get_page(page, size, keyword=""):
    """分页查询：按姓名模糊搜索，返回 (当前页数据, 总条数)"""
    where, args = "", []
    if keyword:
        where = " WHERE name LIKE %s"
        args.append(f"%{keyword}%")
    total = query_one(f"SELECT COUNT(*) AS total FROM teachers{where}", args or None)["total"]
    rows = query_all(
        f"SELECT * FROM teachers{where} ORDER BY id LIMIT %s OFFSET %s",
        [*args, size, (page - 1) * size]
    )
    return rows, total


