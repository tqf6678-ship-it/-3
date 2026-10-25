from org.fyz.common.basedao import query_all,query_one,execute,insert

def get_all():
    """查询所有课程信息"""
    return query_all("SELECT * FROM subjects ORDER BY id")


def get_by_id(subject_id: int):
    """查询单个课程信息"""
    return query_one("SELECT * FROM subjects WHERE id = %s", (subject_id,))


def insert_one(name, sort, points):
    """新增一个课程信息"""
    sql = """
    INSERT INTO subjects (name, sort, points)
    VALUES (%s, %s, %s)
    """
    return insert(sql,(name, sort, points))


def update(subject_id, name, points):
    """更改一个课程信息"""
    sql = """
    UPDATE subjects set name = %s,points = %s WHERE id = %s
    """
    return execute(sql,(name,points,subject_id))


def delete(subject_id):
    """删除一个课程"""
    return execute("DELETE FROM subjects WHERE id = %s", (subject_id,))


def get_page(page, size, keyword = ""):
    """分页查询：按姓名模糊搜索，返回（当前页数据，总条数"""
    where, args = "",[]
    if keyword:
        where = " WHERE name LIKE %s"
        args.append(f"%{keyword}%")

    total = query_one(f"SELECT COUNT(*) AS total FROM subjects {where}", args or None)["total"]

    rows = query_all(
        f"SELECT * FROM subjects {where} ORDER BY id LIMIT %s OFFSET %s",
        [*args, size, (page-1)*size]
        )
    return rows,total











































