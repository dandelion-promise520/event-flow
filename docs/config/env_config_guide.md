# EventFlow - 项目环境配置与依赖管理指南

本指南旨在规范项目的环境部署配置以及明确所使用的依赖包版本，规避硬编码账号密码等安全隐患，防止在异地部署时产生依赖冲突。

---

## 一、 环境配置文件说明

本系统在设计时遵循 **“配置与代码分离”** 的原则，严禁在代码中直接硬编码敏感信息（如数据库地址、账号密码、上传路径等）。所有环境差异化参数均通过环境变量或配置文件引入。

### 1. 环境变量文件 (`.env`)
在项目根目录中，`.env` 文件用于定义 Prisma ORM 访问 SQLite 数据库的本地路径。

- **配置文件路径**：`/[project-root]/.env`
- **文件模板与配置说明**：

```bash
# =========================================================================
# EventFlow 全局环境变量配置文件
# =========================================================================

# 数据库连接字符串 (Prisma 专用)
# 格式: [db_provider]:[db_filepath]
# 本系统默认使用本地嵌入式轻量级 SQLite 数据库，文件存储在 ./prisma/dev.db
# 若要切换为 MySQL 或 PostgreSQL，可修改此连接串。例如对于 MySQL:
# DATABASE_URL="mysql://username:password@localhost:3306/event_flow"
DATABASE_URL="file:./prisma/dev.db"

# =========================================================================
# 安全说明:
# 1. 严禁在代码中直接硬编码 "file:./prisma/dev.db" 或数据库连接密码。
# 2. 生产环境中，建议将 .env 写入系统的环境变量或通过容器 (Docker) 的 -e 参数传入。
# 3. .env 文件默认包含敏感本地连接，因此在 .gitignore 中已做过滤处理，防止提交至代码仓库。
# =========================================================================
```

---

## 二、 依赖管理文件说明 (`package.json`)

本项目采用现代 JavaScript 依赖管理器 **pnpm**，依赖锁文件为 `pnpm-lock.yaml`，严格限制包的版本，杜绝由于次版本升级带来的 API 破损问题。

### 1. 核心生产依赖包列表 (`dependencies`)
以下是项目运行所需的全部核心第三方库，已标明名称、版本号及在系统中的核心作用：

| 依赖包名称 | 版本号 | 所属分类 | 详细功能与用途描述 |
| :--- | :--- | :--- | :--- |
| `next` | `16.2.6` | 核心框架 | Next.js 框架，提供 React 19 服务端渲染 (SSR)、路由管理器 (App Router) 及 API Routes。 |
| `react` | `19.2.4` | 前端底层 | React 19 核心运行库，负责声明式 UI 渲染、状态管理等。 |
| `react-dom` | `19.2.4` | 渲染引擎 | React DOM 服务，负责将 React 组件树渲染到网页 DOM 节点。 |
| `@prisma/client` | `^7.8.0` | 数据库ORM | Prisma 的客户端代码生成器，用于在业务层进行安全的类型化 SQL 增删改查。 |
| `@prisma/adapter-better-sqlite3` | `^7.8.0` | 数据库适配 | 将 Prisma 桥接到原生 SQLite，提高本地读写并发性能。 |
| `bcryptjs` | `^2.4.3` | 安全加密 | 密码哈希加密库。用于用户注册时将明文密码转化为加盐哈希值，并在登录时安全比对，防止拖库风险。 |
| `lucide-react` | `^1.18.0` | 视觉组件 | 现代响应式图标库，提供前台交互、导航、卡片中的各类矢量图标。 |
| `recharts` | `3.8.0` | 数据可视化 | 图表库。在管理员/组织者仪表盘中生成抢票趋势折线图、活动数据分类饼图等。 |
| `date-fns` | `^4.4.0` | 工具库 | 现代 JavaScript 日期处理工具，用于解析、格式化及计算活动的开始与结束时间。 |
| `class-variance-authority` | `^0.7.1` | 样式管理 | (CVA) 用于管理具有多种状态和变体的 CSS 样式（配合 Tailwind & shadcn）。 |
| `clsx` | `^2.1.1` | 样式管理 | 辅助工具，用于有条件地拼接 CSS 类名。 |
| `tailwind-merge` | `^3.6.0` | 样式管理 | 自动合并冲突的 Tailwind CSS 类名，确保组件样式符合覆盖顺序。 |
| `@base-ui/react` | `^1.5.0` | UI无样组件 | 提供无样式的交互组件基础（如弹窗、下拉菜单等），确保高可访问性 (Accessibility)。 |
| `next-themes` | `^0.4.6` | 主题切换 | 实现全局深色模式 (Dark Mode) 与浅色模式的平滑过渡。 |
| `react-day-picker` | `^10.0.1` | UI交互 | 日历选择器组件，用于活动创建时快捷选择举办日期。 |
| `sonner` | `^2.0.7` | UI交互 | 精美的弹窗提示 (Toast) 组件，用于操作成功、失败或警告的轻量通知。 |
| `shadcn` | `^4.11.0` | UI套件 | 主流的 UI 组件脚手架，用于快捷安装基础按钮、对话框、输入框等。 |
| `tw-animate-css` | `^1.4.0` | 动画扩展 | 配合 Tailwind 实现优雅的入场、微动效等过渡动画。 |
| `dotenv` | `^17.4.2` | 工具配置 | 加载本地 `.env` 环境变量的辅助包。 |

### 2. 开发期依赖包列表 (`devDependencies`)
仅在开发、打包构建及质量检测阶段使用，不参与生产打包：

| 依赖包名称 | 版本号 | 所属分类 | 详细功能与用途描述 |
| :--- | :--- | :--- | :--- |
| `typescript` | `^6.0.3` | 编程语言 | 微软 TypeScript 6 编译器，提供静态类型检查，显著减少运行时低级错误。 |
| `prisma` | `^7.8.0` | CLI工具 | Prisma CLI 工具，提供 `prisma db push`、`prisma generate` 等数据库迁移和生成命令。 |
| `tailwindcss` | `^4` | 样式框架 | Tailwind CSS v4 编译器，负责将原子 CSS 类编译为极其紧凑的生产 CSS 代码。 |
| `@tailwindcss/postcss` | `^4` | PostCSS插件 | 允许 Tailwind v4 在传统的 PostCSS 预处理流程中无缝工作。 |
| `eslint` | `^9` | 代码规范 | 代码语法与规范检查工具，发现并强制规范编写风格。 |
| `eslint-config-next` | `16.2.6` | 代码规范 | 适配 Next.js 规则的 ESLint 配置，预防诸如 RSC 边界错误等路由问题。 |
| `prettier` | `^3.8.3` | 代码格式化 | 代码风格自动美化工具，保证多名团队成员协作时代码风格完全一致。 |
| `prettier-plugin-tailwindcss` | `^0.8.0` | 格式化扩展 | Prettier 插件，用于在保存文件时自动对 Tailwind 的类名顺序进行合理排序。 |
| `tsx` | `^4.22.4` | 运行工具 | 允许直接在 Node 环境下执行 TypeScript 脚本（如运行种子数据脚本 `prisma/seed.ts`）。 |
| `code-inspector-plugin` | `^1.6.1` | 辅助工具 | 开发期插件，允许在页面元素上按快捷键直接在编辑器中定位至对应组件代码。 |
| `@types/node` | `^20.19.43` | 类型包 | Node.js 原生 API 的 TypeScript 类型声明。 |
| `@types/react` | `^19` | 类型包 | React 19 框架的 TypeScript 类型声明。 |
| `@types/react-dom` | `^19` | 类型包 | React DOM 的 TypeScript 类型声明。 |
| `@types/bcryptjs` | `^2.4.6` | 类型包 | 加密库 `bcryptjs` 的 TypeScript 类型声明。 |
| `@types/better-sqlite3` | `^7.6.13` | 类型包 | 原生 SQLite 绑定库的 TypeScript 类型声明。 |
