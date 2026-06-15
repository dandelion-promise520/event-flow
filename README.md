# EventFlow - 票务及活动管理系统

这是一个基于 **Next.js 16 (App Router)**、**React 19** 和 **TypeScript 6.0.3** 构建的全栈活动与票务管理系统模板。项目深度集成了 **Prisma ORM**、**SQLite** 以及 **shadcn/ui** 与 **Tailwind CSS v4**。

---

## 🌟 核心特性

- 🔐 **用户认证与角色管理**：支持用户注册、登录，并划分 `USER` (普通用户)、`ORGANIZER` (组织者) 与 `ADMIN` (管理员) 角色。
- 📅 **活动管理**：支持活动的创建、编辑、分类及状态管理（包含票务容量与价格）。
- 🎟️ **票务系统**：支持用户在线订票、生成唯一票码（Ticket Code）以及票务核销（Check-in）流程。
- 🎨 **现代化 UI 设计**：集成 Tailwind CSS v4 及 shadcn/ui，支持响应式布局。
- 🧪 **自动化测试**：预配置了基于 Node.js 原生测试运行器（Test Runner）的单元与集成测试，覆盖认证、活动与票务核心 API。

---

## 🛠️ 技术栈

| 技术 | 描述 |
| :--- | :--- |
| **框架** | Next.js 16.2 (App Router) & React 19 |
| **语言** | TypeScript 6.0.3 |
| **数据库/ORM** | Prisma 7.8 (SQLite 数据库) |
| **样式/组件库** | Tailwind CSS v4 & shadcn/ui |
| **测试框架** | Node.js Test Runner & `tsx` |
| **工具库** | `bcryptjs`, `lucide-react`, `next-themes` |

---

## 📂 目录结构

```text
├── app/                  # Next.js App Router 页面及 API 路由
│   ├── api/              # API 端点 (认证、活动管理、票务核销等)
│   ├── dashboard/        # 用户控制台页面
│   ├── events/           # 活动详情与预订页面
│   ├── login/            # 登录与注册页面
│   ├── layout.tsx        # 全局布局
│   └── page.tsx          # 首页
├── components/           # React 业务组件与 UI 组件
│   └── ui/               # shadcn/ui 基础组件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 公共工具库 (数据库连接、Prisma 客户端实例等)
├── prisma/               # Prisma 配置及数据库文件
│   ├── dev.db            # SQLite 数据库文件 (本地)
│   ├── schema.prisma     # 数据库架构模型文件
│   └── seed.ts           # 数据库种子填充脚本
├── tests/                # 自动化测试文件
└── tsconfig.json         # TypeScript 编译器配置
```

---

## 💾 数据库模型 (Prisma Schema)

项目在 [schema.prisma](file:///D:/Desktop/javaweb/next-app/prisma/schema.prisma) 中定义了以下核心模型：

1. **User (用户)**：
   - 角色：`USER`、`ORGANIZER`、`ADMIN`
   - 关联：一个用户可以创建多个 `Event` (作为组织者)，并拥有多个 `Ticket`。
2. **Event (活动)**：
   - 属性：标题、描述、封面、地点、开始/结束时间、票务容量、价格、分类、状态 (`ACTIVE` 等)
   - 关联：属于一个创建它的 `User`，并包含多个 `Ticket`。
3. **Ticket (门票)**：
   - 属性：唯一票码 (`ticketCode`)、状态 (`UNUSED`, `USED`, `CANCELLED`)
   - 关联：属于购买它的 `User` 以及对应的 `Event`。

---

## 🚀 快速开始

### 1. 克隆并安装依赖

在项目根目录下执行：

```bash
pnpm install
```

### 2. 环境变量配置

在根目录下创建 `.env` 文件（或直接使用已有的 `.env`），确保包含以下配置以指向本地 SQLite 数据库：

```env
DATABASE_URL="file:./prisma/dev.db"
```

### 3. 数据库迁移与数据填充

执行以下命令来推送数据库结构并填充初始种子数据：

```bash
# 生成 Prisma 客户端并同步数据库
npx prisma db push

# 填充种子测试数据 (用户、活动等)
npx prisma db seed
```

### 4. 启动本地开发服务器

```bash
pnpm dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

### 5. 默认测试账户

系统预置了三种角色的测试账户以供快速体验（密码均为 `admin123`）：

| 角色 | 邮箱 (账号) | 密码 | 描述 |
| :--- | :--- | :--- | :--- |
| **系统管理员 (ADMIN)** | `admin@campus.com` | `admin123` | 拥有系统最高权限，可管理所有活动与用户 |
| **组织者 (ORGANIZER)** | `organizer@campus.com` | `admin123` | 可创建并管理属于自己协会的活动、进行门票核销等 |
| **普通学生 (USER)** | `student@campus.com` | `admin123` | 普通用户，可浏览活动、购买门票及查看自己的票夹 |

---

## 🛠️ 开发与测试指南

### 添加 UI 组件 (shadcn/ui)

如需添加新的组件，请运行：

```bash
npx shadcn@latest add <组件名称>
```
例如：
```bash
npx shadcn@latest add button
```

在代码中引入并使用：
```tsx
import { Button } from "@/components/ui/button";
```

### 运行自动化测试

本项目使用 Node.js 原生的测试套件对核心功能 API 进行测试。执行以下命令运行测试：

```bash
pnpm test
```

### 类型检查

```bash
pnpm typecheck
```

### 代码格式化与 Lint 检查

```bash
# 格式化代码
pnpm format

# Lint 校验
pnpm lint
```
