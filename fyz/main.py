import uvicorn
from pathlib import Path
from fastapi import FastAPI, Request
from org.fyz.common.exceptions import BizException
from fastapi.exceptions import RequestValidationError
from org.fyz.common.response import fail
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import logging


# 全局日志配置-方案二
# from org.fyz.common import config
from student.api import router as student_router
from teacher.api import router as teacher_router
from subject.api import router as subject_router
from classes.api import router as classes_router
from schedule.api import router as schedule_router
from checkin.api import router as checkin_router
from score.api import router as score_router
from announcement.api import router as announcement_router
from user.api import router as user_router, auth_router


logger = logging.getLogger(__name__)

app = FastAPI(
    title = "教务管理API",
    description = "用于校务管理中学生及老师管理模块"
)
app.include_router(student_router)
app.include_router(teacher_router)
app.include_router(subject_router)
app.include_router(classes_router)
app.include_router(schedule_router)
app.include_router(checkin_router)
app.include_router(score_router)
app.include_router(announcement_router)
app.include_router(user_router)
app.include_router(auth_router)

# 后台管理静态资源（Bootstrap 5 页面），位于项目根目录 static/ 下
STATIC_DIR = Path(__file__).resolve().parents[1] / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")



@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    """参数校验失败 → 统一格式"""
    logger.error(f"请求 {request.url.path} 参数错误：{exc}")
    err = exc.errors()[0] if exc.errors() else {}
    return JSONResponse(status_code=200, content=fail(f"参数错误：{err.get('msg', '请检查提交内容')}", code=422))

@app.exception_handler(BizException)
async def biz_exception_handler(request: Request, exc: BizException):
    """业务异常：资源不存在等，返回业务码（不当作系统故障）"""
    logger.warning(f"请求 {request.url.path} 业务异常：{exc.msg}")
    return JSONResponse(status_code=200, content=fail(exc.msg, code=exc.code))

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """兜底：系统异常"""
    logger.error(f"请求 {request.url.path} 发生系统异常：{exc}")
    return JSONResponse(status_code=200, content=fail(f"服务器异常：{exc}", code=500))

@app.get("/", include_in_schema=False)
def home():
    """首页：跳转到后台管理界面"""
    return RedirectResponse(url="/static/html/index.html")


@app.get("/login", include_in_schema=False)
def login_page():
    """登录页"""
    return RedirectResponse(url="/static/html/login/index.html")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8007,reload=True)





