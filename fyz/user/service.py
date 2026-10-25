import logging
import re

from org.fyz.common.config import MAX_PAGE_SIZE
from org.fyz.common.exceptions import BizException
from org.fyz.user import dao
from org.fyz.user.security import hash_password, verify_password

logger = logging.getLogger(__name__)

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,20}$")
ROLES = ("admin", "teacher")
PROTECTED_USERNAME = "admin"


def public_user(row):
    if not row:
        return None
    data = dict(row)
    data.pop("password_hash", None)
    return data


def _validate_username(username):
    username = (username or "").strip()
    if not USERNAME_RE.match(username):
        raise BizException("用户名需为 3-20 位字母、数字或下划线", code=1002)
    return username


def _validate_password(password):
    if not password or len(password) < 6:
        raise BizException("密码至少需要 6 位", code=1002)
    return password


def _validate_role(role):
    if role not in ROLES:
        raise BizException("用户角色不合法", code=1002)
    return role


def get_page(page=1, size=10, keyword="", status=-1):
    if status not in (-1, 0, 1):
        raise BizException("用户状态参数不合法", code=1002)
    page = max(1, int(page))
    size = min(max(1, int(size)), MAX_PAGE_SIZE)
    rows, total = dao.get_page(page, size, keyword, status)
    logger.info(
        f"分页查：用户 第{page}页 每页{size}条 关键字={keyword} 状态={status} 共{total}条"
    )
    return {"total": total, "page": page, "size": size, "rows": rows}


def get_by_id(user_id):
    one = dao.get_by_id(user_id)
    if not one:
        raise BizException("用户不存在", code=1000)
    return public_user(one)


def add(username, password, nickname, role, phone, email, status):
    username = _validate_username(username)
    _validate_password(password)
    _validate_role(role)
    if status not in (0, 1):
        raise BizException("用户状态不合法", code=1002)
    if dao.username_exists(username):
        raise BizException("用户名已存在", code=1001)

    nickname = (nickname or "").strip() or username
    newid = dao.insert_one(
        username,
        hash_password(password),
        nickname,
        role,
        (phone or "").strip(),
        (email or "").strip(),
        status,
    )
    logger.info(f"增：用户 id={newid} username={username} role={role}")
    return newid


def update(user_id, nickname, role, phone, email, status):
    one = dao.get_by_id(user_id)
    if not one:
        raise BizException("用户不存在", code=1000)
    _validate_role(role)
    if status not in (0, 1):
        raise BizException("用户状态不合法", code=1002)

    if one["username"] == PROTECTED_USERNAME:
        if role != "admin":
            raise BizException("内置管理员不能修改角色", code=1001)
        if status != 1:
            raise BizException("内置管理员不能停用", code=1001)

    nickname = (nickname or "").strip() or one["username"]
    dao.update(
        user_id, nickname, role, (phone or "").strip(), (email or "").strip(), status
    )
    logger.info(f"改：用户 id={user_id}")
    return dao.get_by_id(user_id)


def reset_password(user_id, password):
    if not dao.get_by_id(user_id):
        raise BizException("用户不存在", code=1000)
    _validate_password(password)
    dao.update_password(user_id, hash_password(password))
    logger.info(f"重置密码：用户 id={user_id}")


def set_status(user_id, status):
    if status not in (0, 1):
        raise BizException("用户状态不合法", code=1002)
    one = dao.get_by_id(user_id)
    if not one:
        raise BizException("用户不存在", code=1000)
    if one["username"] == PROTECTED_USERNAME and status != 1:
        raise BizException("内置管理员不能停用", code=1001)
    dao.update_status(user_id, status)
    logger.info(f"用户状态：id={user_id} status={status}")


def delete(user_id):
    one = dao.get_by_id(user_id)
    if not one:
        raise BizException("用户不存在", code=1000)
    if one["username"] == PROTECTED_USERNAME:
        raise BizException("内置管理员不能删除", code=1001)
    dao.delete(user_id)
    logger.info(f"删：用户 id={user_id}")


def login(username, password):
    username = (username or "").strip()
    one = dao.get_by_username(username)
    if not one or not verify_password(password, one["password_hash"]):
        raise BizException("账号或密码错误", code=1000)
    if one["status"] != 1:
        raise BizException("账号已被停用，请联系管理员", code=1001)

    dao.update_last_login(one["id"])
    logger.info(f"登录：用户 {username}")
    return public_user(one)


def register(username, password, nickname):
    username = _validate_username(username)
    _validate_password(password)
    if dao.username_exists(username):
        raise BizException("用户名已存在", code=1001)

    nickname = (nickname or "").strip() or username
    newid = dao.insert_one(
        username, hash_password(password), nickname, "teacher", "", "", 1
    )
    logger.info(f"注册：用户 id={newid} username={username}")
    return public_user(dao.get_by_id(newid))
