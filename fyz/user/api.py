from typing import Literal

from pydantic import BaseModel, Field
from fastapi import APIRouter
import logging

from org.fyz.user import service
from org.fyz.common.response import ok, fail

router = APIRouter(prefix="/usr", tags=["用户管理"])
auth_router = APIRouter(prefix="/auth", tags=["登录注册"])

logger = logging.getLogger(__name__)


@router.get("/list")
def get_page(
    page: int = 1,
    size: int = 10,
    keyword: str = "",
    status: int = -1,
):
    """查：用户分页列表（不返回密码）"""
    return ok(service.get_page(page, size, keyword, status))


@router.get("/one/{user_id}")
def get_by_id(user_id: int):
    """查：一个用户"""
    if user_id <= 0:
        return fail("用户参数不合法")
    return ok(service.get_by_id(user_id))


class UserAdd(BaseModel):
    """新增用户的数据结构【数据模型】"""
    username: str = Field(..., min_length=3, max_length=20, description="登录账号")
    password: str = Field(..., min_length=6, max_length=100, description="密码")
    nickname: str = Field("", max_length=50, description="显示名称")
    role: Literal["admin", "teacher"] = "teacher"
    phone: str = Field("", max_length=20)
    email: str = Field("", max_length=100)
    status: int = Field(1, ge=0, le=1)


@router.post("/add")
def insert(data: UserAdd):
    """增：一个用户"""
    newid = service.add(
        data.username,
        data.password,
        data.nickname,
        data.role,
        data.phone,
        data.email,
        data.status,
    )
    return ok({"id": newid}, "新增用户成功")


class UserUpdate(BaseModel):
    """修改用户的数据结构【数据模型】"""
    user_id: int = Field(..., ge=1)
    nickname: str = Field("", max_length=50)
    role: Literal["admin", "teacher"] = "teacher"
    phone: str = Field("", max_length=20)
    email: str = Field("", max_length=100)
    status: int = Field(1, ge=0, le=1)


@router.put("/update")
def update(data: UserUpdate):
    """改：一个用户"""
    user = service.update(
        data.user_id,
        data.nickname,
        data.role,
        data.phone,
        data.email,
        data.status,
    )
    return ok(service.public_user(user), "修改用户成功")


class PasswordReset(BaseModel):
    """重置密码的数据结构【数据模型】"""
    user_id: int = Field(..., ge=1)
    password: str = Field(..., min_length=6, max_length=100)


@router.put("/password")
def reset_password(data: PasswordReset):
    """改：重置用户密码"""
    service.reset_password(data.user_id, data.password)
    return ok(msg="密码重置成功")


class StatusUpdate(BaseModel):
    """启用/停用用户的数据结构【数据模型】"""
    user_id: int = Field(..., ge=1)
    status: int = Field(..., ge=0, le=1)


@router.put("/status")
def set_status(data: StatusUpdate):
    """改：启用/停用用户"""
    service.set_status(data.user_id, data.status)
    return ok(msg="用户状态已更新")


@router.delete("/del/{user_id}")
def delete(user_id: int):
    """删：一个用户"""
    if user_id <= 0:
        return fail("用户参数不合法")
    service.delete(user_id)
    return ok(msg="删除用户成功")


class LoginIn(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=100)


@auth_router.post("/login")
def login(data: LoginIn):
    """登录：校验用户表"""
    user = service.login(data.username, data.password)
    return ok(user, "登录成功")


class RegisterIn(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    password: str = Field(..., min_length=6, max_length=100)
    nickname: str = Field("", max_length=50)


@auth_router.post("/register")
def register(data: RegisterIn):
    """注册：写入用户表，默认教师角色"""
    user = service.register(data.username, data.password, data.nickname)
    return ok(user, "注册成功")
