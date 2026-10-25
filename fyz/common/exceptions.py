"""
自定义异常
"""
# 业务状态码（与 response.py 保持一致）
CODE_FAIL = 1   # 通用失败（不传 code 时用）
NOT_EXIST = 1000   # 不存在异常

class BizException(Exception):
    """业务异常：专门表示「业务上的失败」，如资源不存在、状态不合法。

    与系统异常（bug、数据库错误）区分开——只有主动 raise BizException 才会触发，
    不会被全局兜底的 Exception 处理器误当成 500。
    """
    def __init__(self, msg="操作失败", code=CODE_FAIL):
        self.msg = msg
        self.code = code
        super().__init__(msg)














































