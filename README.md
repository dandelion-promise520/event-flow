# EventFlow - 票务及活动管理系统

这是一个基于 **Next.js 16 (App Router)**、**React 19** 和 **TypeScript 6.0.3** 构建的全栈活动与票务管理系统模板。项目深度集成了 **Prisma ORM**、**SQLite** 以及 **shadcn/ui** 与 **Tailwind CSS v4**。

同时，项目集成了符合 **OpenAPI 3.0** 规范的 **Swagger UI** 交互式 API 文档，为开发者提供开箱即用的接口测试与集成能力。

---

## 🌟 核心特性

- 🔐 **用户认证与角色管理**：支持用户注册、登录，并划分 `USER` (普通用户)、`ORGANIZER` (组织者) 与 `ADMIN` (管理员) 角色。
- 📅 **活动管理**：支持活动的创建、编辑、分类及状态管理（包含票务容量与价格）。
- 🎟️ **票务系统**：支持用户在线订票、生成唯一票码（Ticket Code）以及票务核销（Check-in）流程。
- 📖 **交互式 API 文档**：内置 Swagger UI 接口文档（访问 `/api-doc`），基于路由 JSDoc 自动扫描生成。
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
| **API 文档工具** | `next-swagger-doc` & `swagger-ui-react` (OpenAPI 3.0) |
| **测试框架** | Node.js Test Runner & `tsx` |
| **工具库** | `bcryptjs`, `lucide-react`, `next-themes` |

---

## 📂 目录结构

```text
├── app/                  # Next.js App Router 页面及 API 路由
│   ├── api/              # API 端点 (认证、活动管理、票务核销等)
│   │   ├── doc/          # Swagger JSON 规范数据接口 (/api/doc)
│   │   └── ...           # 其它业务 API
│   ├── api-doc/          # Swagger UI 文档渲染页面 (/api-doc)
│   │   ├── react-swagger.tsx # 客户端 SwaggerUI 组件包装器
│   │   └── page.tsx      # 文档页面入口 (服务端组件)
│   ├── dashboard/        # 用户控制台页面
│   ├── events/           # 活动详情与预订页面
│   ├── login/            # 登录与注册页面
│   ├── layout.tsx        # 全局布局
│   └── page.tsx          # 首页
├── components/           # React 业务组件与 UI 组件
│   └── ui/               # shadcn/ui 基础组件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 公共工具库 (数据库连接、Prisma 客户端实例等)
│   ├── swagger.ts        # Swagger 配置文件与 Spec 生成器
│   └── ...
├── prisma/               # Prisma 配置及数据库文件
│   ├── dev.db            # SQLite 数据库文件 (本地)
│   ├── schema.prisma     # 数据库架构模型文件
│   └── seed.ts           # 数据库种子填充脚本
├── tests/                # 自动化测试文件
└── tsconfig.json         # TypeScript 编译器配置
```

---

## 📖 API 接口文档 (Swagger)

项目集成了 Swagger 交互式文档，以便开发人员进行接口查看和模拟请求：

### 1. 访问方式
在本地开发服务运行（`pnpm dev`）后，通过浏览器访问：
- **可视化 UI 页面**：[http://localhost:3000/api-doc](http://localhost:3000/api-doc)
- **JSON 规范数据**：[http://localhost:3000/api/doc](http://localhost:3000/api/doc)（可直接导入 Postman/Apifox）

### 2. 文档编写与更新机制
本项目的 API 文档采用 **注释即文档** 的声明式设计。在 `app/api` 下的各个路由文件 `route.ts` 中，只需在导出函数上方添加 `@swagger` 格式的 JSDoc 注释，即可被 `next-swagger-doc` 自动捕获：

```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 示例登录接口
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功
 */
export async function POST(req: Request) { ... }
```

---

## 💾 数据库模型 (Prisma Schema)

项目在 [schema.prisma](file:///D:/Desktop/javaweb/event-flow/prisma/schema.prisma) 中定义了以下核心模型：

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

## 🚀 快速开始与部署指南

### 1. 运行环境版本要求

为确保项目异地部署无环境冲突，请严格按照以下软件版本进行配置：

| 软件/环境组件 | 推荐版本 | 最低版本要求 | 作用描述 |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.11.0 (LTS)` | `v18.17.0` | 前后端运行期引擎，不建议使用 v22 及以上最新测试版 |
| **包管理器** | `pnpm v9.x` | `pnpm v8.x` | 依赖关系管理器，规避 npm 带来的幽灵依赖和版本不一致问题 |
| **数据库** | `SQLite 3` | 本地集成 | 项目内置轻量级数据库，无需单独配置 MySQL 软件，开箱即用 |
| **现代浏览器** | Chrome 120+ | Edge / Safari | 需支持 ES6 及 CSS 容器查询、Tailwind v4 特效 |

---

### 2. 分步安装与部署流程

### 🐳 Docker 快捷部署

如果您在服务器上部署，项目已预配置好 Docker 与 Docker Compose 支持。您只需通过 Git 克隆本项目到服务器，运行以下一键启动命令即可：

```bash
# 一键构建并后台运行容器
docker compose up -d --build
```

**工作原理与说明**：
1. **自动初始化数据库**：首次运行启动时，容器会自动检测挂载目录中的 `prisma/dev.db` 数据库文件。若不存在，容器会在后台自动同步表结构（`prisma db push`）并自动填充种子测试数据（`prisma db seed`）。
2. **数据持久化**：通过挂载目录，SQLite 数据库文件将持久化保存在宿主机的 `prisma/` 目录下，即便容器销毁重建，数据依然安全且不会丢失。
3. **访问服务**：容器启动成功后，即可通过服务器 IP 访问系统，如：`http://localhost:3000`（在服务器上则为 `http://服务器IP:3000`）。
4. **常用维护命令**：
   - 查看运行日志：`docker compose logs -f`
   - 停止服务：`docker compose down`
   - 重建并重启服务：`docker compose up -d --build`

---

### 3. 本地手动部署流程
进入项目根目录，在终端（PowerShell 或 Bash）中执行：
```bash
pnpm install
```
*提示：安装完成后，系统会自动运行 `postinstall` 挂钩，调用 `prisma generate` 编译生成专属于本项目的数据库类型化客户端。*

#### **步骤二：初始化本地数据库**
系统内置了智能初始化脚本。直接运行以下开发启动命令：
```bash
pnpm dev
```
- **工作原理**：启动时，项目会自动检测 `prisma/dev.db` 文件是否存在。如果不存在，会自动在后台静默执行 `npx prisma db push --accept-data-loss`（同步表结构） and `npx prisma db seed`（写入测试用户、活动及预订数据）。
- **手动重新初始化方法**（如数据混乱需要清空重置）：
  ```bash
  # 1. 删除 prisma 目录下的 dev.db 文件
  # 2. 在根目录执行：
  npx prisma db push --accept-data-loss
  npx prisma db seed
  ```

#### **步骤三：访问系统**
控制台提示 `Ready in xxxms` 后，打开浏览器访问：
- 前台首页：[http://localhost:3000](http://localhost:3000)
- 登录页面：[http://localhost:3000/login](http://localhost:3000/login)

---

### 4. 默认测试账户

系统预置了不同角色的测试账户以供快速体验（密码均为 `admin123`）：

| 角色 | 邮箱 (账号) | 密码 | 描述 |
| :--- | :--- | :--- | :--- |
| **系统管理员 (ADMIN)** | `admin@campus.com` | `admin123` | 拥有系统最高权限，可管理所有活动与用户 |
| **组织者 - 计算机协会** | `organizer@campus.com` | `admin123` | 管理计算机协会的活动、进行门票核销等（已创建3个活动） |
| **组织者 - 大学生艺术团** | `art@campus.com` | `admin123` | 管理艺术团的活动、进行门票核销等（已创建2个活动） |
| **组织者 - 校体育部** | `sports@campus.com` | `admin123` | 管理体育部的活动、进行门票核销等（已创建2个活动） |
| **普通学生 - 张小明** | `student@campus.com` | `admin123` | 普通用户，拥有 3 张不同状态的测试门票（1张未使用、1张已使用、1张已取消） |
| **普通学生 - 李华** | `lihua@campus.com` | `admin123` | 普通用户，拥有 3 张门票（2张未使用、1张已使用） |
| **普通学生 - 王小刚** | `xiaogang@campus.com` | `admin123` | 普通用户，拥有 3 张门票（1张未使用、2张已使用） |
| **普通学生 - 赵盼盼** | `panpan@campus.com` | `admin123` | 普通用户，拥有 2 张未使用门票 |

---

### 5. 常见开发维护命令

```bash
# 1. 运行自动化 API 集成测试套件
pnpm test
 
# 2. TypeScript 类型静态检查
pnpm typecheck

# 3. 自动格式化项目代码风格
pnpm format

# 4. 执行静态代码分析与 ESLint 规范校验
pnpm lint

# 5. 构建生产环境压缩包
pnpm build

# 6. 运行生产环境编译服务
pnpm start
```

---

## ❓ 常见部署报错 Q&A (至少3条)

### **Q1: 运行 `pnpm install` 安装依赖时，better-sqlite3 或 node-gyp 模块报错，提示缺少 C++ 编译环境或 python 路径错误。**
- **原因分析**：`better-sqlite3` 包含部分 C++ 编写的原生底层驱动。在异地部署时，如果目标计算机的 Node.js 架构与编译预构建包不匹配，pnpm 会尝试在本地进行源码编译，而本地缺乏 Visual Studio Build Tools 或 Python 环境时会导致编译挂科。
- **解决方案**：
  1. 强烈建议安装 Node.js LTS 版本（如 `v20.x`），其自带的二进制包覆盖率最广。
  2. 若报错依然存在且不影响正常运行，可使用命令绕过编译测试：`pnpm install --ignore-scripts`
  3. 或者，在 Windows 控制台（以管理员运行）下安装编译工具链：`npm install --global windows-build-tools`

### **Q2: 登录系统时提示 500 错误，或者在控制台看到 `PrismaClientInitializationError: Can't open the database file`**
- **原因分析**：项目底层使用本地 SQLite 数据库。Prisma 引擎在运行时无法在项目目录的 `/prisma/dev.db` 处读取或创建数据库文件。这通常是由于当前执行启动命令的终端工作目录（Cwd）不在项目的根目录下，或者相应的数据库文件权限不足导致的。
- **解决方案**：
  1. 请确保你在项目根目录（即包含 `package.json` 的目录）下执行 `pnpm dev`。
  2. 检查 `/[project-root]/.env` 中的 `DATABASE_URL` 是否被修改。必须保持为 `"file:./prisma/dev.db"` 相对路径。
  3. 确认 `prisma` 目录具有完整的读写权限。

### **Q3: 登录默认的测试账号（如 `admin@campus.com`）时，界面提示“密码错误”或“用户不存在”。**
- **原因分析**：本地 SQLite 数据库文件虽已生成，但未正确写入种子测试数据，导致 `User` 表中为空。
- **解决方案**：
  1. 直接删除 `prisma/dev.db` 数据库文件。
  2. 在项目根目录下打开命令行，手动执行结构同步与种子填充命令：
     ```bash
     npx prisma db push --accept-data-loss
     npx prisma db seed
     ```
  3. 控制台打印 `种子用户数据创建成功!` 等字样后，重新登录尝试。

### **Q4: 端口 3000 被占用，启动失败报错 `Error: listen EADDRINUSE: address already in use :::3000`**
- **原因分析**：本地计算机上已有其他开发项目（如其他 Next.js、React 或 Node 服务）占用了系统 3000 默认端口。
- **解决方案**：
  1. 在 `pnpm dev` 时指定其他空闲端口，例如使用 3001 端口：
     ```bash
     pnpm dev --port 3001
     ```
  2. 或者是关闭占用 3000 端口的进程。在 Windows cmd 中执行：
     ```cmd
     netstat -aon | findstr "3000"
     # 找到对应的 PID（最后一列的数字），例如 1234
     taskkill /F /PID 1234
     ```
