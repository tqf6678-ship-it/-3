-- =========================================================
-- 后台用户表
-- 使用方式：在 school_db_study 库中手动执行本脚本
-- 默认管理员：admin / 123456（密码为 PBKDF2 哈希存储）
-- =========================================================

USE `school_db_study`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT '用户id',
  `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `nickname` VARCHAR(50) NOT NULL COMMENT '显示名称',
  `role` VARCHAR(20) NOT NULL DEFAULT 'teacher' COMMENT '角色：admin管理员 teacher教师',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1正常 0停用',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台用户';

INSERT INTO `users` (`username`, `password_hash`, `nickname`, `role`, `status`)
SELECT 'admin',
       'pbkdf2_sha256$260000$cd08b4363a63951a4a789a3c3ada8f02$5c02687dcfc3a0ec32a90e0a30791ed323ac44f790b6a05745ae596295b893d7',
       '管理员', 'admin', 1
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE `username` = 'admin');
