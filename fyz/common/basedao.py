from org.fyz.common.pool import get_conn


def query_all(sql,args = None):
    """查：所有"""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql,args)
            return cur.fetchall()


def query_one(sql, args = None):
    """查：一个"""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, args)
            return cur.fetchone()


def execute(sql,args = None):
    """写入：涵盖增、删、改操作，返回影响的行数"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql,args)
            rowcount = cur.rowcount
        conn.commit()
        return rowcount
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()


def insert(sql,args = None):
    """写入：新增操作，返回新增的自增主键ID"""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql,args)
            new_id = cur.lastrowid
        conn.commit()
        return new_id
    except Exception as e:
        conn.rollback()
        raise
    finally:
        conn.close()


# if __name__ == '__main__':
    # # 查询非事务
    # sql_all = "SELECT * FROM students"
    # # print(query_all(sql_all))
    # sql_one = "SELECT * FROM students WHERE id = %s"
    # # print(query_one(sql_one,(1,)))
    #
    #
    # # 增删改事务
    # # 增
    # sql_add = """
    # INSERT INTO students (name,gender,age,teacher_id,grade,enrollment_date)
    # VALUES (%s, %s, %s, %s, %s, %s)
    # """
    # print(execute(sql_add,("张三四",'女',18,1,'高一','2026-10-19')))
    # print(insert(sql_add,("张三四",'女',18,1,'高一','2026-10-19')))
    #
    # # 删
    # sql_del = "DELETE FROM students WHERE id = %s"
    # print(execute(sql_del,(24,)))
    # # 改
    # sql_update = """
    # UPDATE students set name = %s,age = %s,grade = %s WHERE id = %s
    # """
    # print(execute(sql_update,("张三",18,'高一',1)))


