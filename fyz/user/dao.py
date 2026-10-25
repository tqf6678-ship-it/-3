from org.fyz.common.basedao import query_all, query_one, execute, insert


def get_page(page, size, keyword="", status=-1):
    """分页查询用户，不返回密码哈希"""
    where, args = [], []
    if keyword:
        where.append("(username LIKE %s OR nickname LIKE %s)")
        args.extend([f"%{keyword}%", f"%{keyword}%"])
    if status in (0, 1):
        where.append("status = %s")
        args.append(status)
    clause = (" WHERE " + " AND ".join(where)) if where else ""

    total = query_one(
        f"SELECT COUNT(*) AS total FROM users{clause}", args or None
    )["total"]

    rows = query_all(
        f"""
        SELECT id, username, nickname, role, phone, email, status,
               last_login_time, create_time, update_time
        FROM users
        {clause}
        ORDER BY id
        LIMIT %s OFFSET %s
        """,
        [*args, size, (page - 1) * size],
    )
    return rows, int(total)


def get_by_id(user_id):
    return query_one("SELECT * FROM users WHERE id = %s", (user_id,))


def get_by_username(username):
    return query_one("SELECT * FROM users WHERE username = %s", (username,))


def username_exists(username, exclude_id=0):
    return query_one(
        "SELECT id FROM users WHERE username = %s AND id <> %s",
        (username, exclude_id),
    ) is not None


def insert_one(username, password_hash, nickname, role, phone, email, status):
    sql = """
    INSERT INTO users
        (username, password_hash, nickname, role, phone, email, status)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    return insert(
        sql, (username, password_hash, nickname, role, phone, email, status)
    )


def update(user_id, nickname, role, phone, email, status):
    sql = """
    UPDATE users
    SET nickname = %s, role = %s, phone = %s, email = %s, status = %s
    WHERE id = %s
    """
    return execute(sql, (nickname, role, phone, email, status, user_id))


def update_password(user_id, password_hash):
    return execute(
        "UPDATE users SET password_hash = %s WHERE id = %s",
        (password_hash, user_id),
    )


def update_status(user_id, status):
    return execute("UPDATE users SET status = %s WHERE id = %s", (status, user_id))


def update_last_login(user_id):
    return execute(
        "UPDATE users SET last_login_time = CURRENT_TIMESTAMP WHERE id = %s",
        (user_id,),
    )


def delete(user_id):
    return execute("DELETE FROM users WHERE id = %s", (user_id,))
