-- =========================================================
-- 系统公告
-- 使用方式：在 school_db_study 库中手动执行本脚本
-- =========================================================

USE `school_db_study`;

CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '公告id',
  `title` VARCHAR(100) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1发布 0草稿',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_announcement_status_time` (`status`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统公告';

INSERT INTO `announcements` (`title`, `content`, `status`)
SELECT '欢迎使用教务管理系统',
       '欢迎使用教务管理系统！请及时维护学生、教师、班级与课程信息，保持数据准确。',
       1
WHERE NOT EXISTS (SELECT 1 FROM `announcements` WHERE `title` = '欢迎使用教务管理系统');

INSERT INTO `announcements` (`title`, `content`, `status`)
SELECT '2026 学年第一学期开学安排',
       '请各班级在本周内完成学生报到，并在成绩管理中及时录入、核对成绩。',
       1
WHERE NOT EXISTS (SELECT 1 FROM `announcements` WHERE `title` = '2026 学年第一学期开学安排');
