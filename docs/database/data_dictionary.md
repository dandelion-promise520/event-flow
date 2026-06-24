# EventFlow - 系统数据字典

本系统采用轻量级关系型数据库，主要包含 6 张核心数据表：用户表 (`User`)、分类表 (`Category`)、活动表 (`Event`)、门票表 (`Ticket`)、评价表 (`Review`) 以及通知表 (`Notification`)。

---

## 1. 用户表 (`User`)
- **描述**：存储系统所有用户（包括普通学生、组织者、系统管理员）的基本信息和身份权限。

| 字段名称 | 物理名称 | 数据类型 | 允许空 | 默认值 | 约束/索引 | 描述 |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| 用户ID | `id` | VARCHAR(36) | 否 | UUID() | 主键 | 唯一标识符（UUID） |
| 电子邮箱 | `email` | VARCHAR(191) | 否 | 无 | 唯一索引 | 登录账号，全系统唯一 |
| 用户昵称 | `name` | VARCHAR(191) | 否 | 无 | 无 | 用户真实姓名或组织名称 |
| 登录密码 | `password` | VARCHAR(191) | 否 | 无 | 无 | 使用 bcrypt (10 轮迭代) 加密后的哈希值 |
| 角色权限 | `role` | VARCHAR(191) | 否 | 'USER' | 无 | 权限区分：`ADMIN` (管理员), `ORGANIZER` (活动组织者), `USER` (普通学生) |
| 创建时间 | `createdAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 账号创建时间 |
| 更新时间 | `updatedAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 账号最后一次修改时间 |

---

## 2. 活动分类表 (`Category`)
- **描述**：存储活动的分类信息，便于前台检索与归类。

| 字段名称 | 物理名称 | 数据类型 | 允许空 | 默认值 | 约束/索引 | 描述 |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| 分类ID | `id` | VARCHAR(36) | 否 | UUID() | 主键 | 唯一标识符（UUID） |
| 分类名称 | `name` | VARCHAR(191) | 否 | 无 | 唯一索引 | 例如：学术讲座、文体比赛、社团活动 |
| 创建时间 | `createdAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 分类创建时间 |
| 更新时间 | `updatedAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 分类信息更新时间 |

---

## 3. 活动表 (`Event`)
- **描述**：记录所有由活动组织者发布的校园活动信息。

| 字段名称 | 物理名称 | 数据类型 | 允许空 | 默认值 | 约束/索引 | 描述 |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| 活动ID | `id` | VARCHAR(36) | 否 | UUID() | 主键 | 唯一标识符（UUID） |
| 活动标题 | `title` | VARCHAR(191) | 否 | 无 | 无 | 活动名称 |
| 活动描述 | `description` | TEXT | 否 | 无 | 无 | 活动详细介绍、流程、参与要求等 |
| 封面图片 | `coverUrl` | VARCHAR(191) | 是 | NULL | 无 | 活动宣传海报图片的存储路径/URL |
| 活动地点 | `location` | VARCHAR(191) | 否 | 无 | 无 | 具体举办场所，如计科楼、图书馆报告厅 |
| 开始时间 | `startTime` | DATETIME(3) | 否 | 无 | 无 | 活动正式开始时间 |
| 结束时间 | `endTime` | DATETIME(3) | 否 | 无 | 无 | 活动结束时间 |
| 票务容量 | `capacity` | INT | 否 | 无 | 无 | 最大可抢票/预约人数上限 |
| 票务价格 | `price` | DOUBLE | 否 | 0.0 | 无 | 活动报名费用，默认为 0.0（免费活动） |
| 活动分类 | `category` | VARCHAR(191) | 否 | 无 | 无 | 关联分类名称 |
| 活动状态 | `status` | VARCHAR(191) | 否 | 'ACTIVE' | 无 | `ACTIVE` (发布中/可预订), `CANCELLED` (已取消) |
| 创建时间 | `createdAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 活动发布时间 |
| 更新时间 | `updatedAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 活动最后修改时间 |
| 组织者ID | `organizerId` | VARCHAR(36) | 否 | 无 | 外键 | 关联 `User` 表的 `id`，级联删除 |

---

## 4. 门票表 (`Ticket`)
- **描述**：记录用户对活动的预订记录及核销状态。

| 字段名称 | 物理名称 | 数据类型 | 允许空 | 默认值 | 约束/索引 | 描述 |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| 门票ID | `id` | VARCHAR(36) | 否 | UUID() | 主键 | 唯一标识符（UUID） |
| 票务券码 | `ticketCode` | VARCHAR(191) | 否 | 无 | 唯一索引 | 12位唯一核销码，如：TKT-XM-UNUSED，用于扫码或输入核销 |
| 票务状态 | `status` | VARCHAR(191) | 否 | 'UNUSED' | 无 | `UNUSED` (未使用), `USED` (已使用/核销), `CANCELLED` (已取消/退票) |
| 预订时间 | `bookedAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 抢票成功时间 |
| 更新时间 | `updatedAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 状态最后修改时间 |
| 用户ID | `userId` | VARCHAR(36) | 否 | 无 | 外键 | 关联购买者 `User` 表的 `id`，级联删除 |
| 活动ID | `eventId` | VARCHAR(36) | 否 | 无 | 外键 | 关联对应活动 `Event` 表的 `id`，级联删除 |

---

## 5. 活动评价表 (`Review`)
- **描述**：存储用户在参与活动后发表的真实评分与文字评价。

| 字段名称 | 物理名称 | 数据类型 | 允许空 | 默认值 | 约束/索引 | 描述 |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| 评价ID | `id` | VARCHAR(36) | 否 | UUID() | 主键 | 唯一标识符（UUID） |
| 星级评分 | `rating` | INT | 否 | 无 | 无 | 评分范围为 1 至 5 颗星 |
| 评价内容 | `content` | TEXT | 否 | 无 | 无 | 用户撰写的评价文字内容 |
| 创建时间 | `createdAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 评价发表时间 |
| 更新时间 | `updatedAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 评价更新时间 |
| 用户ID | `userId` | VARCHAR(36) | 否 | 无 | 外键 / 联合唯一 | 关联评价者 `User` 表的 `id`，级联删除 |
| 活动ID | `eventId` | VARCHAR(36) | 否 | 无 | 外键 / 联合唯一 | 关联活动 `Event` 表的 `id`，级联删除 |

> **联合唯一约束**：`userId` 与 `eventId` 构成联合唯一索引 (`Review_userId_eventId_key`)，限制每个用户对每个活动只能发表一次评价。

---

## 6. 系统通知表 (`Notification`)
- **描述**：用于向用户推送系统级消息通知（例如门票核销成功通知、活动取消通知等）。

| 字段名称 | 物理名称 | 数据类型 | 允许空 | 默认值 | 约束/索引 | 描述 |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| 通知ID | `id` | VARCHAR(36) | 否 | UUID() | 主键 | 唯一标识符（UUID） |
| 通知标题 | `title` | VARCHAR(191) | 否 | 无 | 无 | 消息概括标题 |
| 消息内容 | `content` | TEXT | 否 | 无 | 无 | 详细通知内容 |
| 是否已读 | `isRead` | TINYINT(1) | 否 | 0 | 无 | 阅读状态：0 代表未读，1 代表已读 |
| 创建时间 | `createdAt` | DATETIME(3) | 否 | CURRENT_TIMESTAMP | 无 | 消息发送时间 |
| 用户ID | `userId` | VARCHAR(36) | 否 | 无 | 外键 | 关联接收者 `User` 表的 `id`，级联删除 |
