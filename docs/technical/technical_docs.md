# EventFlow - 系统专业技术文档

本技术文档主要面向系统架构设计评估与论文技术章节撰写，包含了系统的业务流程图、UML类图、UML时序图以及数据库ER图，均采用规范的 **Mermaid** 矢量图语法编写，可直接在支持 Markdown/Mermaid 渲染的阅读器或浏览器中进行查看与编辑。

---

## 一、 系统业务流程图

本节展示了系统核心角色的业务办理流程：包括普通学生的“抢票与核销流程”以及组织者的“活动管理与核销流程”。

### 1. 普通学生购票与核销流程

```mermaid
graph TD
    Start([开始]) --> Login{是否登录?}
    Login -- 否 --> GoLogin[跳转登录/注册] --> InputAuth[输入邮箱与密码] --> AuthCheck{验证凭证}
    AuthCheck -- 失败 --> GoLogin
    AuthCheck -- 成功 --> Browse[浏览活动列表/分类检索]
    Login -- 是 --> Browse
    Browse --> Detail[进入活动详情页]
    Detail --> CheckStatus{活动是否可订?<br/>容量>0 且 状态为 ACTIVE}
    CheckStatus -- 否 --> ShowDisabled[按钮禁用/置灰] --> End([结束])
    CheckStatus -- 是 --> ClickBook[点击 立即预订 按钮]
    ClickBook --> ApiCall[前端发起预订请求]
    ApiCall --> TxCheck{后端事务校验<br/>1. 重复购票校验<br/>2. 剩余余量校验}
    TxCheck -- 校验失败 --> ShowError[提示购票失败/已售罄] --> Detail
    TxCheck -- 校验成功 --> CreateTicket[1. 生成12位唯一核销码<br/>2. 创建 Ticket 记录<br/>3. 发送系统通知]
    CreateTicket --> ReturnSuccess[返回门票信息]
    ReturnSuccess --> ShowTicket[用户控制台查看 待使用 门票/核销码]
    ShowTicket --> ShowToOrg[线下参与活动出示券码]
    ShowToOrg --> OrgVerify{组织者核销}
    OrgVerify -- 核销成功 --> StatusUsed[门票状态变更为 USED]
    StatusUsed --> WriteReview[用户发表活动评价]
    WriteReview --> End
```

### 2. 组织者活动发布与核销流程

```mermaid
graph TD
    Start([开始]) --> OrgLogin[登录组织者账号]
    OrgLogin --> Dashboard[进入组织者控制台]
    Dashboard --> ClickCreate[点击 发布新活动]
    ClickCreate --> FormInput[填写表单: 标题/描述/时间/地点/容量/价格/分类]
    FormInput --> SubmitForm[提交活动信息]
    SubmitForm --> ApiCheck{后端数据合法性校验}
    ApiCheck -- 失败 --> ShowFormError[提示错误并重新输入] --> FormInput
    ApiCheck -- 成功 --> DbInsert[写入 Event 表并发布]
    DbInsert --> ActiveStatus[活动状态置为 ACTIVE 并前台展示]
    ActiveStatus --> WaitCheckIn[线下活动举办, 准备核销]
    WaitCheckIn --> InputCode[核销界面输入或扫描用户 TICKET_CODE]
    InputCode --> ApiVerify{后端校验门票<br/>1. 券码是否存在<br/>2. 状态是否为 UNUSED}
    ApiVerify -- 校验失败 --> ShowInvalid[界面提示 券码无效/已被使用]
    ApiVerify -- 校验成功 --> UpdateStatus[1. 门票状态变更为 USED<br/>2. 生成核销成功通知并推送]
    UpdateStatus --> ShowSuccess[界面提示 核销成功，显示持票人信息]
    ShowSuccess --> End([结束])
```

---

## 二、 数据库 ER 图

本系统采用经典的关系型数据模型，表与表之间建立了严格的外键约束与级联操作。

```mermaid
erDiagram
    User {
        string id PK "用户唯一ID (UUID)"
        string email UK "电子邮箱 (登录账号)"
        string name "用户姓名/组织名称"
        string password "加盐加密密码哈希"
        string role "角色权限 (ADMIN/ORGANIZER/USER)"
        datetime createdAt "创建时间"
        datetime updatedAt "最后修改时间"
    }

    Category {
        string id PK "分类唯一ID"
        string name UK "分类名称 (如学术讲座)"
        datetime createdAt "创建时间"
        datetime updatedAt "更新时间"
    }

    Event {
        string id PK "活动唯一ID"
        string title "活动标题"
        string description "活动图文详情"
        string coverUrl "封面图路径"
        string location "活动地点"
        datetime startTime "开始时间"
        datetime endTime "结束时间"
        int capacity "预订容量限制"
        float price "票价 (免费为 0.0)"
        string category "分类名称"
        string status "活动状态 (ACTIVE/CANCELLED)"
        datetime createdAt "创建时间"
        datetime updatedAt "更新时间"
        string organizerId FK "组织者ID (外键关联 User.id)"
    }

    Ticket {
        string id PK "门票唯一ID"
        string ticketCode UK "12位唯一核销码"
        string status "状态 (UNUSED/USED/CANCELLED)"
        datetime bookedAt "预订抢票时间"
        datetime updatedAt "状态更新时间"
        string userId FK "购票人ID (外键关联 User.id)"
        string eventId FK "对应活动ID (外键关联 Event.id)"
    }

    Review {
        string id PK "评价唯一ID"
        int rating "星级评分 (1至5)"
        string content "文字评价内容"
        datetime createdAt "发表时间"
        datetime updatedAt "修改时间"
        string userId FK "评价人ID (外键关联 User.id)"
        string eventId FK "被评价活动ID (外键关联 Event.id)"
    }

    Notification {
        string id PK "通知唯一ID"
        string title "消息通知标题"
        string content "详细通知正文"
        boolean isRead "是否已读状态"
        datetime createdAt "发送时间"
        string userId FK "接收人ID (外键关联 User.id)"
    }

    User ||--o{ Event : "发布活动 (organizerId)"
    User ||--o{ Ticket : "购买门票 (userId)"
    User ||--o{ Review : "发表评价 (userId)"
    User ||--o{ Notification : "接收消息 (userId)"
    Event ||--o{ Ticket : "生成门票 (eventId)"
    Event ||--o{ Review : "获得评价 (eventId)"
    Category ||--o{ Event : "分类限制 (category)"
```

---

## 三、 UML 类图

展示系统数据模型实体类（通过 Prisma Client 实体生成）以及控制器接口层之间的交互逻辑关系。

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String name
        +String password
        +String role
        +DateTime createdAt
        +DateTime updatedAt
        +getCreatedEvents() Event[]
        +getTickets() Ticket[]
    }

    class Event {
        +String id
        +String title
        +String description
        +String coverUrl
        +String location
        +DateTime startTime
        +DateTime endTime
        +Int capacity
        +Float price
        +String category
        +String status
        +String organizerId
        +getOrganizer() User
        +getTickets() Ticket[]
        +getReviews() Review[]
    }

    class Ticket {
        +String id
        +String ticketCode
        +String status
        +DateTime bookedAt
        +String userId
        +String eventId
        +getUser() User
        +getEvent() Event
    }

    class Review {
        +String id
        +Int rating
        +String content
        +String userId
        +String eventId
        +getUser() User
        +getEvent() Event
    }

    class Notification {
        +String id
        +String title
        +String content
        +Boolean isRead
        +String userId
        +getUser() User
    }

    class Category {
        +String id
        +String name
    }

    User "1" *-- "0..*" Event : "发布"
    User "1" *-- "0..*" Ticket : "抢购"
    User "1" *-- "0..*" Review : "评价"
    User "1" *-- "0..*" Notification : "接收"
    Event "1" *-- "0..*" Ticket : "包含"
    Event "1" *-- "0..*" Review : "获得"
    Category "1" ..> "0..*" Event : "划分"
```

---

## 四、 UML 时序图

本节通过时序图展示系统中两个最核心的高并发/状态转换逻辑：**用户在线购票（事务操作）** 以及 **组织者核销门票**。

### 1. 用户在线购票时序图

```mermaid
sequenceDiagram
    autonumber
    actor User as 普通学生 (前端浏览器)
    participant Front as Web 前端 (Next.js Component)
    participant Api as 购票 API (/api/tickets)
    participant DB as SQLite 数据库 (Prisma ORM)
    
    User->>Front: 点击 "立即预订" 按钮
    Front->>Api: 发送 POST 请求 { eventId: "evt-1" } (附带用户 Session)
    activate Api
    Api->>DB: 查询当前活动详情及已购票数 (Event & TicketCount)
    activate DB
    DB-->>Api: 返回 Event 数据和已订票数 (99/100张)
    deactivate DB
    
    Note over Api: 后端校验逻辑:<br/>1. 活动是否存在 & status == ACTIVE?<br/>2. 预订时间是否合法?<br/>3. 已订票数 (99) < 容量 (100)?
    
    alt 活动已售罄或状态非 ACTIVE
        Api-->>Front: 返回 400 错误 JSON { success: false, message: "活动已售罄/不可预订" }
        Front-->>User: 页面弹出 Toast 提示: 活动门票已售完
    else 校验通过，进入核心创建流程 (Prisma 数据库事务)
        Api->>DB: 开启数据库事务 (Transaction)
        activate DB
        Api->>DB: 1. 插入 Ticket 表新记录 (状态='UNUSED', 12位唯一核销码)<br/>2. 插入 Notification 表 (写入"预订成功通知")
        DB-->>Api: 事务执行成功并提交 (Commit)
        deactivate DB
        
        Api-->>Front: 返回 200 成功 JSON { success: true, ticket: TicketData }
        deactivate Api
        Front-->>User: 弹出成功动画，并重定向至 "我的门票" 控制面板
    end
```

### 2. 组织者核销门票时序图

```mermaid
sequenceDiagram
    autonumber
    actor Org as 活动组织者
    participant Front as 组织者核销后台 (Next.js Dashboard)
    participant Api as 核销 API (/api/tickets/check-in)
    participant DB as 数据库 (Prisma DB)
    actor Student as 持票普通学生
    
    Student->>Org: 现场出示 12 位核销码 (例如: TKT-XM-UNUSED)
    Org->>Front: 手动录入核销码并点击 "确认核销"
    activate Front
    Front->>Api: 发送 POST 请求 { ticketCode: "TKT-XM-UNUSED" }
    activate Api
    
    Api->>DB: 查询门票记录 (携带对应的 Event 和 User 信息)
    activate DB
    DB-->>Api: 返回 Ticket 记录及关联实体
    deactivate DB
    
    Note over Api: 后端校验逻辑:<br/>1. 门票是否存在?<br/>2. 门票状态是否为 "UNUSED"?<br/>3. 当前登录用户是否为该活动的组织者 (权鉴)?
    
    alt 门票不存在或状态已是 USED/CANCELLED
        Api-->>Front: 返回 400 错误 JSON { success: false, message: "该券码已被核销或无效" }
        Front-->>Org: 界面标红提示: 核销失败 (无效的券码)
    else 校验通过
        Api->>DB: 1. 更新 Ticket 状态为 'USED'<br/>2. 插入 Notification 消息给购票人 ("门票核销成功通知")
        activate DB
        DB-->>Api: 更新成功
        deactivate DB
        
        Api-->>Front: 返回 200 成功 JSON { success: true, userName: "张小明", eventTitle: "2026年校园极客马拉松" }
        deactivate Api
        Front-->>Org: 界面绿色提示: 核销成功！欢迎张小明入场
        deactivate Front
    end
```
