import pymysql
from dbutils.pooled_db import PooledDB

DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "user": "root",
    "password": "123456",
    "database": "school_db_study",
    "charset": "utf8mb4",
    "cursorclass" : pymysql.cursors.DictCursor
}

# PooledDB实例化连接池对象参数
_pool = PooledDB(
    creator = pymysql,      # 使用哪个驱动链接数据库
    mincached= 5,           # 连接池启动时首次初始化链接个数
    maxcached = 5,          # 连接池空闲最多链接个数
    maxconnections = 40,    # 连接池链接数上限
    ping = 1,               # 探活，放8小时断链
    blocking = True,        # 配置连接池中链接都被占用时的处理策略：True：等待；False：异常
    **DB_CONFIG
)

def get_conn():
    """一次从链接池中借一个链接，借完要记得归还"""
    return _pool.connection()












