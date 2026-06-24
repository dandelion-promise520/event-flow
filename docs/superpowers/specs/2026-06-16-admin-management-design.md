# 活动分类管理与系统账号管理——设计规格说明书

本设计说明书旨在为 EventFlow 项目新增“活动分类管理”与“系统账号管理”功能。这两项功能仅面向系统管理员（`ADMIN`）角色开放，采用子路由架构进行开发，以保证代码的高内聚、低耦合。

---

## 1. 成功标准与可验证目标
* **验证 1（权限阻断）**：非 `ADMIN` 角色（如学生 `USER` 或组织者 `ORGANIZER`）直接在浏览器输入 `/dashboard/categories` 或 `/dashboard/accounts` 时，系统能正确重定向回个人控制台，接口层也能够正确返回 403。
* **验证 2（分类增删改查）**：
  - 管理员可成功添加、修改分类。
  - 删除分类时，若无关联活动，能成功删除；若有关联活动，能正确拦截删除并给出友好警告。
  - 发布活动表单的分类下拉菜单会动态读取数据库的最新分类。
* **验证 3（账号增删改查）**：
  - 管理员能创建新账号（支持选择角色）。
  - 支持按姓名/邮箱进行模糊搜索及角色筛选。
  - 允许重置指定账号的密码。
  - 删除账号时，会提示级联删除风险，并能彻底移除该用户及其名下所有关联数据。

---

## 2. 数据库模型变更 (Database Schema)

在 [`prisma/schema.prisma`](file:///D:/Desktop/javaweb/event-flow/prisma/schema.prisma) 中添加 `Category` 模型，用于动态存储活动分类。
为了保证现有代码及查询的最大兼容性，`Event` 模型的 `category` 属性依旧保持 `String` 类型：

```prisma
model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

* **更新指令**：修改后在终端运行 `npx prisma db push` 同步数据库，并运行 `npx prisma db seed` 重建种子数据（种子文件中将添加初始化分类逻辑）。

---

## 3. 后端 API 路由设计

所有后台接口均通过参数或 Header 接收操作者 ID (`adminId`)，并在执行前校验其角色是否为 `ADMIN`。

### 3.1 活动分类管理接口 (`/api/categories`)
* **`GET /api/categories`**
  - 功能：获取所有分类列表。
  - 响应：`Category[]`。
* **`POST /api/categories`**
  - 功能：新建分类。
  - 参数：`{ adminId: string, name: string }`。
  - 校验：`name` 不能为空且不能与现有分类重名。
* **`PUT /api/categories?id=...`**
  - 功能：更新分类名称。
  - 参数：`{ adminId: string, name: string }`。
* **`DELETE /api/categories?id=...&adminId=...`**
  - 功能：删除分类。
  - 校验：查询 `prisma.event.count({ where: { category: categoryName } })`，若大于 0，则返回错误代码并提示：“无法删除：当前分类下有关联活动。”

### 3.2 账号管理接口 (`/api/users`)
* **`GET /api/users?adminId=...&search=...&role=...`**
  - 功能：分页/筛选获取用户列表。
  - 参数：`search`（支持对姓名和邮箱模糊匹配），`role`（支持过滤）。
* **`POST /api/users`**
  - 功能：创建新用户。
  - 参数：`{ adminId: string, name: string, email: string, role: string, password?: string }` / `bcryptjs` 加密密码。
* **`PUT /api/users?id=...`**
  - 功能：更新用户资料或重置密码。
  - 参数：`{ adminId: string, name: string, email: string, role: string, password?: string }`（密码有输入时才进行加密并更新）。
* **`DELETE /api/users?id=...&adminId=...`**
  - 功能：删除指定用户账号（级联删除活动和门票数据）。

---

## 4. 前端页面与交互设计

我们将建立以下子路由页面：

### 4.1 控制台入口页变更 ([`app/dashboard/page.tsx`](file:///D:/Desktop/javaweb/event-flow/app/dashboard/page.tsx))
当登录用户的角色为 `ADMIN` 时，在控制台欢迎语下方展示卡片入口：
- 📂 **活动分类管理** (前往 `/dashboard/categories`) —— 用于新增、编辑和移除分类。
- 👥 **系统账号管理** (前往 `/dashboard/accounts`) —— 用于维护系统内的所有学生、组织者及管理员。

### 4.2 活动分类管理页 ([`app/dashboard/categories/page.tsx`](file:///D:/Desktop/javaweb/event-flow/app/dashboard/categories/page.tsx))
- **展示形式**：
  - 顶部导航区（返回个人控制台按钮）。
  - 分类数据表：展示分类名称、创建时间，操作列提供“修改”、“删除”。
  - “添加分类”按钮：点击唤起表单弹窗。

### 4.3 账号管理页 ([`app/dashboard/accounts/page.tsx`](file:///D:/Desktop/javaweb/event-flow/app/dashboard/accounts/page.tsx))
- **展示形式**：
  - 搜索与筛选工具条：包含模糊搜索框、角色选择菜单、以及“新建用户”按钮。
  - 用户数据表：展示姓名、邮箱、系统角色、注册时间。
  - 操作按钮组：
    - **编辑/重置密码**：弹窗表单修改信息。
    - **删除账号**：使用 `AlertDialog` 强化提示用户该操作会一并删除该账号发布的活动及门票。
