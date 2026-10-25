"""
全局统一响应处理
"""
# 业务状态
CODE_OK = 0  # 成功
CODE_FAIL = 1# 通用失败（不传code时用）



def ok(data=None,msg = "sucess"):
    """成功返回：code固定为0"""
    return {"code":CODE_OK, "msg":msg, "data":data}

def fail(msg = "操作失败",code = CODE_FAIL,data=None):
    """失败返回：默认code为1"""
    return {"code":code,"msg":msg,"data":data}














