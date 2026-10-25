-- =========================================================
-- 学生补充学习科目
-- 使用方式：在 school_db_study 库中手动执行本脚本
-- 说明：
--   1. 班级课表里的科目由 class_schedules 推导，不需要重复存入本表。
--   2. 本表只保存学生额外添加的科目（例如课表外选修）。
--   3. 科目必须已存在于 subjects 表。
-- =========================================================

USE `school_db_study`;

CREATE TABLE IF NOT EXISTS `student_subjects` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '记录id',
  `student_id` INT NOT NULL COMMENT '学生id',
  `subject_id` INT NOT NULL COMMENT '科目id',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_subject` (`student_id`, `subject_id`),
  KEY `idx_student_subject_subject` (`subject_id`),
  CONSTRAINT `fk_student_subject_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_student_subject_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生补充学习科目';
