"""
全局配置公共配置
"""
import logging

MAX_PAGE_SIZE = 100

logging.basicConfig(
    level = logging.INFO,# 配置日志输出级别
    # asctime：时间戳；threadName：当前运行的线程名称；levelname：日志输出级别；name：模块名称；message：日志信息；
    format = "%(asctime)s - %(threadName)s - [%(levelname)s] - %(name)s:%(message)s",# 配置日志输出格式
    handlers = [# 配置日志输出目标类型
        logging.FileHandler("../fyz/教务管理系统.log", encoding ="utf-8"),  # 日志文件输出
        logging.StreamHandler()                                             # 控制台输出
    ]
)


