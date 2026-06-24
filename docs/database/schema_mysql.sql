-- ==========================================
-- EventFlow - MySQL 数据库建表与初始化脚本
-- 适用环境: MySQL 5.7+ / 8.0+
-- 默认管理员账号: admin@campus.com / 密码: admin123
-- ==========================================

-- 创建数据库 (可选)
-- CREATE DATABASE IF NOT EXISTS `event_flow` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `event_flow`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------
-- 1. 创建分类表 (Category)
-- ------------------------------------------
DROP TABLE IF EXISTS `Category`;
CREATE TABLE `Category` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `Category_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 2. 创建用户表 (User)
-- ------------------------------------------
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL, -- 存储 bcrypt 加密后的哈希值，测试数据中明文均为: admin123
    `role` VARCHAR(191) NOT NULL DEFAULT 'USER', -- 角色: ADMIN, ORGANIZER, USER
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 3. 创建活动表 (Event)
-- ------------------------------------------
DROP TABLE IF EXISTS `Event`;
CREATE TABLE `Event` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `coverUrl` VARCHAR(191) DEFAULT NULL,
    `location` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `capacity` INT NOT NULL,
    `price` DOUBLE NOT NULL DEFAULT 0.0,
    `category` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE', -- 状态: ACTIVE, CANCELLED
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `organizerId` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `Event_organizerId_fkey` FOREIGN KEY (`organizerId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 4. 创建门票表 (Ticket)
-- ------------------------------------------
DROP TABLE IF EXISTS `Ticket`;
CREATE TABLE `Ticket` (
    `id` VARCHAR(36) NOT NULL,
    `ticketCode` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNUSED', -- 状态: UNUSED, USED, CANCELLED
    `bookedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(36) NOT NULL,
    `eventId` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Ticket_ticketCode_key` (`ticketCode`),
    CONSTRAINT `Ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Ticket_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 5. 创建评价表 (Review)
-- ------------------------------------------
DROP TABLE IF EXISTS `Review`;
CREATE TABLE `Review` (
    `id` VARCHAR(36) NOT NULL,
    `rating` INT NOT NULL, -- 评分: 1-5
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(36) NOT NULL,
    `eventId` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Review_userId_eventId_key` (`userId`, `eventId`),
    CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `Review_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------
-- 6. 创建通知表 (Notification)
-- ------------------------------------------
DROP TABLE IF EXISTS `Notification`;
CREATE TABLE `Notification` (
    `id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `isRead` TINYINT(1) NOT NULL DEFAULT 0, -- 0-未读, 1-已读
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(36) NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- 初始化测试数据 (Seed Data)
-- ==========================================

-- 1. 写入分类数据
INSERT INTO `Category` (`id`, `name`, `createdAt`, `updatedAt`) VALUES
('cat-1', '学术讲座', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('cat-2', '文体比赛', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('cat-3', '社团活动', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000');

-- 2. 写入用户数据 (密码明文均为: admin123, 对应的 bcrypt hash 为 $2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i)
INSERT INTO `User` (`id`, `email`, `name`, `password`, `role`, `createdAt`, `updatedAt`) VALUES
('u-admin', 'admin@campus.com', '系统管理员', '$2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i', 'ADMIN', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('u-organizer', 'organizer@campus.com', '计算机协会', '$2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i', 'ORGANIZER', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('u-organizer-art', 'art@campus.com', '大学生艺术团', '$2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i', 'ORGANIZER', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('u-organizer-sports', 'sports@campus.com', '校体育部', '$2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i', 'ORGANIZER', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('u-student', 'student@campus.com', '张小明 (普通学生)', '$2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i', 'USER', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('u-student-li', 'lihua@campus.com', '李华 (外国语学院)', '$2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i', 'USER', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('u-student-wang', 'xiaogang@campus.com', '王小刚 (物理学院)', '$2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i', 'USER', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000'),
('u-student-zhao', 'panpan@campus.com', '赵盼盼 (艺术学院)', '$2a$10$w09Z/tY9P/Fq.4l1fXoEgu7l.ZfX3s3M5f1OaN8dF.2n3w0eS2L3i', 'USER', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000');

-- 3. 写入活动数据
INSERT INTO `Event` (`id`, `title`, `description`, `coverUrl`, `location`, `startTime`, `endTime`, `capacity`, `price`, `category`, `status`, `createdAt`, `updatedAt`, `organizerId`) VALUES
('evt-1', '2026年校园极客马拉松大赛', '在24小时内用代码解决核心挑战，丰厚大奖等你拿！提供餐饮和睡眠区。', '/uploads/geek-marathon.jpg', '计科楼 405 实验室', '2026-06-20 09:00:00.000', '2026-06-21 12:00:00.000', 100, 0.0, '学术讲座', 'ACTIVE', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000', 'u-organizer'),
('evt-4', '人工智能前沿与大型语言模型应用', '特邀业界专家分享大语言模型的最新进展、开源社区生态与校园创新应用实践。', '/uploads/ai-forum.jpg', '图书馆报告厅', '2026-06-16 14:00:00.000', '2026-06-16 17:00:00.000', 200, 0.0, '学术讲座', 'ACTIVE', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000', 'u-organizer'),
('evt-3', '夏日社团趣味桌游交流会', '欢迎所有新生加入，体验阿瓦隆、狼人杀、卡坦岛等多款桌游，结交新朋友！', '/uploads/board-games.jpg', '大学生活动中心 201', '2026-06-18 14:00:00.000', '2026-06-18 18:00:00.000', 30, 0.0, '社团活动', 'ACTIVE', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000', 'u-organizer'),
('evt-2', '校园歌手大赛总决赛', '十佳歌手同台飙歌，现场观众互动投出人气大奖！', '/uploads/singer-contest.jpg', '大礼堂', '2026-06-25 19:00:00.000', '2026-06-25 21:30:00.000', 500, 0.0, '文体比赛', 'ACTIVE', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000', 'u-organizer-art'),
('evt-6', '草地音乐节与文创跳蚤市场', '落日余晖下的现场乐队，琳琅满目的手工作品与闲置好物，一起来感受夏日晚风的浪漫。', '/uploads/music-festival.jpg', '东区大草坪', '2026-06-28 16:00:00.000', '2026-06-28 22:00:00.000', 1000, 0.0, '社团活动', 'ACTIVE', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000', 'u-organizer-art'),
('evt-5', '“迎新杯”校园羽毛球混合双打赛', '展现青春活力，促进社团交流，羽毛球双打巅峰对决，等你来战！', '/uploads/badminton.jpg', '风雨操场羽毛球馆', '2026-06-22 08:30:00.000', '2026-06-22 18:00:00.000', 64, 0.0, '文体比赛', 'ACTIVE', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000', 'u-organizer-sports'),
('evt-8', '校园星空夜跑挑战赛', '用脚步丈量夏夜校园，荧光装备免费发放。强身健体，释放压力！', '/uploads/night-run.jpg', '学校主体育场', '2026-06-14 19:30:00.000', '2026-06-14 21:30:00.000', 800, 0.0, '文体比赛', 'ACTIVE', '2026-06-24 00:00:00.000', '2026-06-24 00:00:00.000', 'u-organizer-sports');

-- 4. 写入门票数据
INSERT INTO `Ticket` (`id`, `ticketCode`, `status`, `bookedAt`, `updatedAt`, `userId`, `eventId`) VALUES
('t-1', 'TKT-XM-UNUSED', 'UNUSED', '2026-06-24 08:00:00.000', '2026-06-24 08:00:00.000', 'u-student', 'evt-1'),
('t-2', 'TKT-XM-USED', 'USED', '2026-06-24 08:05:00.000', '2026-06-24 08:05:00.000', 'u-student', 'evt-2'),
('t-3', 'TKT-XM-CANCELLED', 'CANCELLED', '2026-06-24 08:10:00.000', '2026-06-24 08:10:00.000', 'u-student', 'evt-3'),
('t-4', 'TKT-LH-USED', 'USED', '2026-06-24 08:15:00.000', '2026-06-24 08:15:00.000', 'u-student-li', 'evt-1'),
('t-5', 'TKT-LH-UNUSED1', 'UNUSED', '2026-06-24 08:20:00.000', '2026-06-24 08:20:00.000', 'u-student-li', 'evt-5'),
('t-6', 'TKT-LH-UNUSED2', 'UNUSED', '2026-06-24 08:25:00.000', '2026-06-24 08:25:00.000', 'u-student-li', 'evt-2'),
('t-7', 'TKT-WG-USED1', 'USED', '2026-06-24 08:30:00.000', '2026-06-24 08:30:00.000', 'u-student-wang', 'evt-4'),
('t-8', 'TKT-WG-UNUSED', 'UNUSED', '2026-06-24 08:35:00.000', '2026-06-24 08:35:00.000', 'u-student-wang', 'evt-1'),
('t-9', 'TKT-WG-USED2', 'USED', '2026-06-24 08:40:00.000', '2026-06-24 08:40:00.000', 'u-student-wang', 'evt-8'),
('t-10', 'TKT-PP-UNUSED1', 'UNUSED', '2026-06-24 08:45:00.000', '2026-06-24 08:45:00.000', 'u-student-zhao', 'evt-2'),
('t-11', 'TKT-PP-UNUSED2', 'UNUSED', '2026-06-24 08:50:00.000', '2026-06-24 08:50:00.000', 'u-student-zhao', 'evt-6');

-- 5. 写入评价数据
INSERT INTO `Review` (`id`, `rating`, `content`, `createdAt`, `updatedAt`, `userId`, `eventId`) VALUES
('rev-1', 5, '非常好的活动，十佳歌手唱歌太好听了，现场氛围特别棒！', '2026-06-24 10:00:00.000', '2026-06-24 10:00:00.000', 'u-student', 'evt-2');

-- 6. 写入通知数据
INSERT INTO `Notification` (`id`, `title`, `content`, `isRead`, `createdAt`, `userId`) VALUES
('not-1', '门票核销成功通知', '您的《校园歌手大赛总决赛》门票已成功核销。欢迎在活动页面撰写您的评价！', 0, '2026-06-24 10:05:00.000', 'u-student');
