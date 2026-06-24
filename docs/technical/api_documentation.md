# EventFlow - 系统 API 接口文档

本接口文档详细规范了 EventFlow 系统所提供的 RESTful 风格后端 API，涉及用户认证、活动管理、分类展示、票务预订、票务核销以及系统通知。

---

## 协议与通用参数
- **请求协议**：HTTP/1.1
- **数据传输格式**：JSON
- **字符编码**：UTF-8
- **基本路径**：`http://localhost:3000`

---

## 一、 用户认证接口

### 1. 用户登录
- **接口路径**：`POST /api/auth/login`
- **接口描述**：校验电子邮箱与密码。若匹配成功，返回用户信息及对应的角色权限。
- **请求参数 (JSON Body)**：

| 参数名 | 类型 | 是否必填 | 示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `email` | String | 是 | `admin@campus.com` | 用户注册的电子邮箱账号 |
| `password` | String | 是 | `admin123` | 明文密码 |

- **返回响应示例 (JSON)**：
  - **成功 (200 OK)**:
    ```json
    {
      "success": true,
      "user": {
        "id": "u-admin",
        "email": "admin@campus.com",
        "name": "系统管理员",
        "role": "ADMIN"
      }
    }
    ```
  - **失败 (400 Bad Request)**:
    ```json
    {
      "success": false,
      "message": "密码错误"
    }
    ```

### 2. 用户注册
- **接口路径**：`POST /api/auth/register`
- **接口描述**：新建普通学生/组织者账户，对密码进行 bcrypt 加密并入库。
- **请求参数 (JSON Body)**：

| 参数名 | 类型 | 是否必填 | 示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `email` | String | 是 | `newuser@campus.com` | 电子邮箱（不能与已有账号重复） |
| `name` | String | 是 | `王刚` | 用户昵称或姓名 |
| `password` | String | 是 | `password123` | 原始明文密码（长度不少于 6 位） |
| `role` | String | 否 | `USER` | 注册角色，可选 `USER` 或 `ORGANIZER`，默认为 `USER` |

- **返回响应示例 (JSON)**：
  - **成功 (200 OK)**:
    ```json
    {
      "success": true,
      "user": {
        "id": "new-user-uuid",
        "email": "newuser@campus.com",
        "name": "王刚",
        "role": "USER"
      }
    }
    ```

---

## 二、 活动管理接口

### 1. 获取活动列表
- **接口路径**：`GET /api/events`
- **接口描述**：根据分类名称或组织者 ID 检索活动，按创建时间降序排列，并返回每个活动已售出的票数。
- **请求参数 (Query String)**：

| 参数名 | 类型 | 是否必填 | 示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `category` | String | 否 | `学术讲座` | 过滤的分类名称 |
| `organizerId` | String | 否 | `u-organizer` | 过滤的发布组织者ID |

- **返回响应示例 (JSON - Array)**：
  ```json
  [
    {
      "id": "evt-1",
      "title": "2026年校园极客马拉松大赛",
      "description": "在24小时内用代码解决核心挑战...",
      "coverUrl": "/images/geek-marathon.jpg",
      "location": "计科楼 405 实验室",
      "startTime": "2026-06-20T09:00:00.000Z",
      "endTime": "2026-06-21T12:00:00.000Z",
      "capacity": 100,
      "price": 0,
      "category": "学术讲座",
      "status": "ACTIVE",
      "createdAt": "2026-06-24T00:00:00.000Z",
      "updatedAt": "2026-06-24T00:00:00.000Z",
      "organizerId": "u-organizer",
      "organizer": {
        "name": "计算机协会"
      },
      "bookedCount": 3
    }
  ]
  ```

### 2. 创建活动
- **接口路径**：`POST /api/events`
- **接口描述**：组织者发布新活动。要求开始时间不能早于当前时间。
- **请求参数 (JSON Body)**：

| 参数名 | 类型 | 是否必填 | 示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `title` | String | 是 | `算法大讲堂` | 活动标题 |
| `description` | String | 否 | `数据结构与算法专题解析` | 活动图文描述 |
| `coverUrl` | String | 否 | `/uploads/logo.png` | 海报图片路径 |
| `location` | String | 是 | `主教楼 301` | 活动举办地点 |
| `startTime` | String | 是 | `2026-07-01T09:00:00` | 开始时间 (ISO格式) |
| `endTime` | String | 是 | `2026-07-01T11:00:00` | 结束时间 (ISO格式) |
| `capacity` | Integer | 是 | 50 | 活动名额容量限制 |
| `price` | Float/String| 否 | `0` | 报名费用（默认为0） |
| `category` | String | 是 | `学术讲座` | 所属分类名称 |
| `organizerId` | String | 是 | `u-organizer` | 发布此活动的组织者用户ID |

- **返回响应示例 (JSON)**：
  - **成功 (200 OK)**:
    ```json
    {
      "success": true,
      "event": {
        "id": "evt-new-uuid",
        "title": "算法大讲堂",
        "capacity": 50,
        "price": 0,
        "status": "ACTIVE",
        "organizerId": "u-organizer"
      }
    }
    ```

### 3. 修改活动
- **接口路径**：`PUT /api/events?id={eventId}`
- **接口描述**：编辑已发布活动的属性（如标题、时间、容量等）。
- **请求参数 (Query String + JSON Body)**：
  - **Query 参数**: `id`（活动ID）
  - **Body 参数**: 与创建活动相同。
- **返回响应示例 (JSON)**：
  ```json
  {
    "success": true,
    "event": {
      "id": "evt-1",
      "title": "更新后的极客马拉松",
      "capacity": 120
    }
  }
  ```

### 4. 删除活动
- **接口路径**：`DELETE /api/events?id={eventId}`
- **接口描述**：下架或物理删除某个活动。
- **返回响应示例 (JSON)**：
  ```json
  {
    "success": true,
    "message": "活动删除成功"
  }
  ```

---

## 三、 分类管理接口

### 1. 获取全部分类
- **接口路径**：`GET /api/categories`
- **接口描述**：获取系统中定义的全部活动分类标签。
- **返回响应示例 (JSON - Array)**：
  ```json
  [
    { "id": "cat-1", "name": "学术讲座" },
    { "id": "cat-2", "name": "文体比赛" },
    { "id": "cat-3", "name": "社团活动" }
  ]
  ```

---

## 四、 门票预订与核销接口

### 1. 获取门票列表
- **接口路径**：`GET /api/tickets`
- **接口描述**：根据用户 ID 或活动 ID 检索购票核销记录，支持联表拉取活动详情与买家信息。
- **请求参数 (Query String)**：

| 参数名 | 类型 | 是否必填 | 示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `userId` | String | 否 | `u-student` | 购票学生的ID |
| `eventId` | String | 否 | `evt-1` | 活动ID |

- **返回响应示例 (JSON - Array)**：
  ```json
  [
    {
      "id": "t-1",
      "ticketCode": "TKT-XM-UNUSED",
      "status": "UNUSED",
      "bookedAt": "2026-06-24T08:00:00.000Z",
      "userId": "u-student",
      "eventId": "evt-1",
      "event": {
        "title": "2026年校园极客马拉松大赛",
        "location": "计科楼 405 实验室"
      },
      "user": {
        "name": "张小明 (普通学生)",
        "email": "student@campus.com"
      }
    }
  ]
  ```

### 2. 预订活动门票 (抢票)
- **接口路径**：`POST /api/tickets`
- **接口描述**：学生在线预约/购买活动门票。在事务中自动校验名额余量与重复预订，成功后会生成唯一的 `ticketCode` 并向购票人发送系统通知。
- **请求参数 (JSON Body)**：

| 参数名 | 类型 | 是否必填 | 示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `userId` | String | 是 | `u-student` | 订票的学生用户ID |
| `eventId` | String | 是 | `evt-1` | 报名的活动ID |

- **返回响应示例 (JSON)**：
  - **成功 (200 OK)**:
    ```json
    {
      "success": true,
      "ticket": {
        "id": "t-new-uuid",
        "ticketCode": "EVT-20260624-54129",
        "status": "UNUSED",
        "userId": "u-student",
        "eventId": "evt-1"
      }
    }
    ```
  - **名额已满 (400 Bad Request)**:
    ```json
    {
      "success": false,
      "message": "活动名额已满"
    }
    ```
  - **重复报名 (400 Bad Request)**:
    ```json
    {
      "success": false,
      "message": "您已报名该活动"
    }
    ```

### 3. 现场门票核销 (Check-in)
- **接口路径**：`POST /api/tickets/checkin`
- **接口描述**：活动组织者在活动入口输入或扫描门票核销码进行身份验证和入场登记。成功核销后门票状态变更，并推送通知给购票人。
- **请求参数 (JSON Body)**：

| 参数名 | 类型 | 是否必填 | 示例值 | 说明 |
| :--- | :--- | :---: | :--- | :--- |
| `ticketCode` | String | 是 | `EVT-20260624-54129` | 门票唯一的12位核销字符码 |

- **返回响应示例 (JSON)**：
  - **成功 (200 OK)**:
    ```json
    {
      "success": true,
      "message": "核销成功",
      "detail": {
        "eventTitle": "2026年校园极客马拉松大赛",
        "userName": "张小明",
        "checkinTime": "10:15:30"
      }
    }
    ```
  - **门票已被核销 (400 Bad Request)**:
    ```json
    {
      "success": false,
      "message": "该门票已被核销，请勿重复扫描！"
    }
    ```
  - **门票无效 (404 Not Found)**:
    ```json
    {
      "success": false,
      "message": "找不到该门票信息"
    }
    ```

---

## 五、 系统通知接口

### 1. 获取通知列表
- **接口路径**：`GET /api/notifications?userId={userId}`
- **接口描述**：查询当前用户收到的全部系统消息，按发送时间倒序排列。
- **返回响应示例 (JSON - Array)**：
  ```json
  [
    {
      "id": "not-1",
      "title": "门票核销成功通知",
      "content": "您的《校园歌手大赛总决赛》门票已成功核销。欢迎在活动页面撰写您的评价！",
      "isRead": false,
      "createdAt": "2026-06-24T10:05:00.000Z",
      "userId": "u-student"
    }
  ]
  ```

### 2. 标记通知为已读
- **接口路径**：`PUT /api/notifications?id={notificationId}`
- **接口描述**：将指定的系统消息状态置为已读。
- **返回响应示例 (JSON)**：
  ```json
  {
    "success": true,
    "message": "通知已标记为已读"
  }
  ```
