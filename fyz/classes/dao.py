from org.fyz.common.basedao import query_all, query_one, execute, insert


def get_all():
    """查询所有班级信息"""
    return query_all("SELECT * FROM classes ORDER BY id")


def get_by_id(class_id: int):
    """查询单个班级信息"""
    return query_one("SELECT * FROM classes WHERE id = %s", (class_id,))


def code_exists(code, exclude_id=0):
    """判断班级编号是否已存在（排除自身）"""
    return query_one(
        "SELECT id FROM classes WHERE code = %s AND id <> %s",
        (code, exclude_id),
    ) is not None


def insert_one(name, code, address):
    """新增一个班级信息"""
    sql = """
    INSERT INTO classes (name, code, address)
    VALUES (%s, %s, %s)
    """
    return insert(sql, (name, code, address))


def update(class_id, name, code, address):
    """更改一个班级信息"""
    sql = """
    UPDATE classes SET name = %s, code = %s, address = %s WHERE id = %s
    """
    return execute(sql, (name, code, address, class_id))


def delete(class_id):
    """删除一个班级"""
    return execute("DELETE FROM classes WHERE id = %s", (class_id,))


def count_students(class_id):
    """统计该班级下的学生数量"""
    return query_one(
        "SELECT COUNT(*) AS c FROM students WHERE class_id = %s", (class_id,)
    )["c"]


def count_teachers(class_id):
    """统计该班级下的教师数量"""
    return query_one(
        "SELECT COUNT(*) AS c FROM teachers WHERE class_id = %s", (class_id,)
    )["c"]


def get_page(page, size, keyword=""):
    """分页查询：按班级名称或编号模糊搜索，返回（当前页数据，总条数）"""
    where, args = "", []
    if keyword:
        where = " WHERE (name LIKE %s OR code LIKE %s)"
        args.extend([f"%{keyword}%", f"%{keyword}%"])

    total = query_one(
        f"SELECT COUNT(*) AS total FROM classes{where}", args or None
    )["total"]

    rows = query_all(
        f"SELECT * FROM classes{where} ORDER BY id LIMIT %s OFFSET %s",
        [*args, size, (page - 1) * size],
    )
    return rows, total
