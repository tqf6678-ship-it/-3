-- =========================================================
-- 学生报到记录
-- 使用方式：在 school_db_study 库中手动执行本脚本
-- 说明：每个学生最多一条报到记录；没有记录表示“未报到”
-- =========================================================

USE `school_db_study`;

CREATE TABLE IF NOT EXISTS `student_checkins` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '报到记录id',
  `student_id` INT NOT NULL COMMENT '学生id',
  `checkin_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报到时间',
  `remark` VARCHAR(200) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_checkin_student` (`student_id`),
  CONSTRAINT `fk_checkin_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生报到记录';

-- 说明：
-- 1. student_id 唯一：一个学生只保留一条当前报到记录。
-- 2. 重复报到会更新报到时间和备注，不会新增重复行。
-- 3. 删除学生时，其报到记录自动删除。
-- 4. 如需按学期保存历史，可后续增加学期字段并调整唯一键。
