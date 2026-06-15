# EventFlow 功能丰富化设计文档

本项目旨在为 EventFlow（票务及活动管理系统）扩充三大核心模块：
1. **组织者数据看板 (数据明细表与 CSV 导出)**
2. **闭环活动评价与评分系统 (仅限核销到场用户)**
3. **消息与通知中心 (站内信提示与组织者广播)**

---

## 💾 1. 数据库模型设计 (Prisma Schema)

我们将在 `prisma/schema.prisma` 中新增 `Review` 和 `Notification` 模型，并扩展 `User` 与 `Event` 模型的关联。

```prisma
// 新增 Review (活动打分与评价) 模型
model Review {
  id        String   @id @default(uuid())
  rating    Int      // 1 至 5 的评分值
  content   String   // 评价文字内容
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  // 保证每个用户对每个活动只能评价一次
  @@unique([userId, eventId])
}

// 新增 Notification (站内消息与通知) 模型
model Notification {
  id        String   @id @default(uuid())
  title     String
  content   String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 扩展现有 User 模型
model User {
  id            String         @id @default(uuid())
  // ... 现有字段 ...
  reviews       Review[]
  notifications Notification[]
}

// 扩展现有 Event 模型
model Event {
  id            String         @id @default(uuid())
  // ... 现有字段 ...
  reviews       Review[]
}
```

---

## 🔌 2. API 接口设计

### 2.1 组织者数据看板数据获取
- **路径**：`GET /api/events/dashboard`
- **角色限制**：`ORGANIZER` 或 `ADMIN`
- **描述**：拉取当前组织者所创建的活动及对应的所有门票预订、核销明细。
- **返回数据**：
  ```json
  {
    "events": [
      {
        "id": "event-uuid",
        "title": "计算机技术讲座",
        "capacity": 100,
        "price": 0.0,
        "soldCount": 45,
        "checkedInCount": 38
      }
    ],
    "tickets": [
      {
        "id": "ticket-uuid",
        "eventTitle": "计算机技术讲座",
        "userName": "张小明",
        "userEmail": "student@campus.com",
        "status": "USED",
        "bookedAt": "2026-06-15T14:32:00.000Z",
        "updatedAt": "2026-06-15T19:15:00.000Z"
      }
    ]
  }
  ```

### 2.2 活动评价接口
- **路径**：`POST /api/events/[id]/reviews`
- **角色限制**：`USER` / `ORGANIZER` / `ADMIN` (需登录)
- **描述**：提交用户对某个活动的评价和星级。
- **校验逻辑**：后端验证当前用户是否拥有一张该活动且状态为 `USED` 的门票，且该用户未曾评价过该活动。
- **请求体**：
  ```json
  {
    "rating": 5,
    "content": "老师讲得非常好，受益匪浅！"
  }
  ```

- **路径**：`GET /api/events/[id]/reviews`
- **描述**：公开拉取某个活动下的所有用户评分和评价列表。

### 2.3 消息与通知接口
- **路径**：`GET /api/notifications`
- **描述**：获取当前登录用户最新的 50 条站内信，按时间倒序。
- **路径**：`POST /api/notifications/read`
- **描述**：将某些通知标记为已读。若请求体中 `ids` 为空数组，则将当前用户所有未读通知标记为已读。
- **请求体**：
  ```json
  {
    "ids": ["notification-uuid-1"]
  }
  ```

### 2.4 组织者群发通知广播接口
- **路径**：`POST /api/events/[id]/broadcast`
- **角色限制**：`ORGANIZER` 或 `ADMIN`
- **描述**：由活动创建者向所有购买了该活动门票的用户群发一条站内信通知。
- **校验逻辑**：验证当前活动是否存在，且其组织者 `organizerId` 为当前登录用户。
- **请求体**：
  ```json
  {
    "title": "【重要通知】活动教室变更",
    "content": "原定于新楼 201 教室的讲座，由于报名人数超出预期，现调整到主楼 101 教室，时间保持不变，请大家知悉。"
  }
  ```

---

## 🎨 3. 前端 UI/UX 布局设计

### 3.1 顶部通知中心 Popover (Header Popover)
- 在顶部导航栏中增加 `Bell` 图标，显示未读红点（Unread Count）。
- 点击下拉展示卡片列表：
  - 显示通知标题、内容及相对时间（如 "10分钟前"）。
  - 右上角有“标记所有为已读”按钮。
  - 不同消息（如“群发广播”或“门票核销成功”）使用不同图标或样式区分。

### 3.2 组织者数据看板表格与导出 (Data Grid & Export)
- 组织者看板页面 (`app/dashboard/page.tsx`) 增设数据明细表格，呈现所有门票预定：
  - 筛选器：按活动过滤、按门票状态过滤、姓名/邮箱文本模糊搜索。
  - **导出 CSV 功能**：纯前端将过滤后数据导出为 `CSV` 并触发浏览器下载，不增加后端服务器资源消耗。

### 3.3 活动详情评价展示与表单 (Reviews List & Form)
- 在活动详情页 (`app/events/[id]/page.tsx`) 底部新增评价列表。
- 引入评分星级组件，支持点击打分（1-5 星）和撰写评价。
- **表单展示条件**：只有在当前用户对本活动有 `USED` 门票，且未曾提交过评价时，才显示提交评价的输入卡片。

---

## 🧪 4. 自动化测试策略

我们将遵循**测试驱动开发 (TDD)** 原则，在 `tests/` 下编写针对各 API 接口的单元与集成测试，测试工具链继续使用 Node.js 原生的 Test Runner (与现有项目保持一致)：

1. **看板数据 API 测试**：验证非组织者请求被拒绝，验证返回字段结构正确。
2. **评价 API 校验测试**：
   - 验证未购票/未核销用户提交评价返回 `403/400 Forbidden`。
   - 验证已核销用户可以成功评价，并获取活动平均分。
   - 验证重复评价返回 `400 Bad Request`。
3. **通知与已读状态测试**：验证自动触发逻辑（订票、核销时触发 Notification 写入），验证已读标记接口。
4. **广播 API 校验测试**：验证非创建者群发返回 `403 Forbidden`，验证创建者群发后所有购票人均收到站内信。
