from org.fyz.common.basedao import query_all, query_one, execute, insert


def get_page(page, size, keyword="", status=-1):
    """分页查询公告，按创建时间倒序"""
    where, args = [], []
    if keyword:
        where.append("(title LIKE %s OR content LIKE %s)")
        args.extend([f"%{keyword}%", f"%{keyword}%"])
    if status in (0, 1):
        where.append("status = %s")
        args.append(status)
    clause = (" WHERE " + " AND ".join(where)) if where else ""

    total = query_one(
        f"SELECT COUNT(*) AS total FROM announcements{clause}", args or None
    )["total"]

    rows = query_all(
        f"""
        SELECT * FROM announcements
        {clause}
        ORDER BY create_time DESC, id DESC
        LIMIT %s OFFSET %s
        """,
        [*args, size, (page - 1) * size],
    )
    return rows, int(total)


def get_by_id(announcement_id):
    return query_one(
        "SELECT * FROM announcements WHERE id = %s", (announcement_id,)
    )


def insert_one(title, content, status):
    sql = """
    INSERT INTO announcements (title, content, status)
    VALUES (%s, %s, %s)
    """
    return insert(sql, (title, content, status))


def update(announcement_id, title, content, status):
    sql = """
    UPDATE announcements SET title = %s, content = %s, status = %s
    WHERE id = %s
    """
    return execute(sql, (title, content, status, announcement_id))


def delete(announcement_id):
    return execute("DELETE FROM announcements WHERE id = %s", (announcement_id,))
