-- =========================================================
-- 班级课表
-- 使用方式：在 school_db_study 库中手动执行本脚本
-- 依赖：classes、subjects、teachers 三张表已存在
-- =========================================================

USE `school_db_study`;

CREATE TABLE IF NOT EXISTS `class_schedules` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '课表id',
  `class_id` INT NOT NULL COMMENT '班级id',
  `subject_id` INT NOT NULL COMMENT '课程id',
  `teacher_id` INT NOT NULL COMMENT '教师id',
  `weekday` TINYINT NOT NULL COMMENT '星期（1-7）',
  `period` TINYINT NOT NULL COMMENT '节次（1-8）',
  `location` VARCHAR(100) DEFAULT NULL COMMENT '上课地点',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_schedule_slot` (`class_id`, `weekday`, `period`),
  KEY `idx_schedule_teacher` (`teacher_id`, `weekday`, `period`),
  KEY `idx_schedule_subject` (`subject_id`),
  CONSTRAINT `fk_schedule_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_schedule_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_schedule_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级课表';

-- 说明：
-- 1. weekday：1-7，分别对应星期一至星期日。
-- 2. period：1-8，表示第几节课。
-- 3. (class_id, weekday, period) 唯一：同一班级同一时间只能有一节课。
-- 4. 删除班级时，该班级的课表会自动删除（ON DELETE CASCADE）。
-- 5. 教师或课程仍被课表引用时，不能直接删除（ON DELETE RESTRICT）。
