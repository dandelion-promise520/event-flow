# 管理员控制台大盘重构 (Admin Dashboard Redesign) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重新设计管理员控制台首页 (`/dashboard`)，引入现代、精致的 Bento Grid (便当盒) 布局与 Apple 风格的微磨砂玻璃质感 (Glassmorphism)。同时设计右上角视图切换器，优雅解耦系统大盘数据与活动发布/管理视图。

**Architecture:** 在 `app/dashboard/page.tsx` 中引入 `activeTab` 状态控制。使用 Tailwind 的透明背景、毛玻璃模糊、渐变阴影等样式进行美化。保持所有 API 接口、Prisma 查询和性能优化（Promise.all）不变。

**Tech Stack:** Next.js (React), Tailwind CSS, Lucide Icons, Shadcn components.

## Global Constraints

- Commit 提交信息必须使用中文。
- 与用户交流必须使用中文。
- 尽量由 globals.css 统一色彩与微调，保证暗黑模式与浅色模式视觉高级感。

---

### Task 1: 视图切换状态与控制栏实现

**Files:**
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `campus_user` state, `User` interface.
- Produces: `activeTab` state (`"stats" | "events"`) to switch between views.

- [ ] **Step 1: 增加 activeTab 状态**

在 `app/dashboard/page.tsx` 组件内声明 `activeTab` 状态，并默认为 `"stats"`：
```typescript
const [activeTab, setActiveTab] = useState<"stats" | "events">("stats")
```

- [ ] **Step 2: 在 Header 部分添加切换控件**

在页面头部的“控制台概览”下方或右侧增加高颜值的 Segmented Control 切换开关（微磨砂背景与淡阴影）：
```tsx
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
  <div>
    <h1 className="text-2xl font-bold tracking-tight text-foreground">控制台概览</h1>
    <p className="text-sm text-muted-foreground mt-1">
      欢迎回来，{user.name} ({user.role === "USER" ? "学生" : user.role === "ADMIN" ? "系统管理员" : "主办方"})
    </p>
  </div>
  {user.role === "ADMIN" && (
    <div className="inline-flex h-9 items-center gap-1 rounded-full bg-muted/60 p-1 border border-border/40 select-none">
      <button
        onClick={() => setActiveTab("stats")}
        className={cn(
          "rounded-full px-4 py-1 text-xs font-bold transition-all duration-200 cursor-pointer",
          activeTab === "stats"
            ? "bg-card text-brand shadow-xs border border-border/20"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        系统统计大盘
      </button>
      <button
        onClick={() => setActiveTab("events")}
        className={cn(
          "rounded-full px-4 py-1 text-xs font-bold transition-all duration-200 cursor-pointer",
          activeTab === "events"
            ? "bg-card text-brand shadow-xs border border-border/20"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        活动发布与管理
      </button>
    </div>
  )}
</div>
```

- [ ] **Step 3: 验证类型检查与已有测试通过**

运行命令：
```bash
pnpm typecheck
pnpm test
```
Expected: 编译通过且所有 15 个集成测试通过。

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: 为管理员控制台添加系统大盘与活动管理视图切换控制器"
```

---

### Task 2: 管理员 Bento Grid + Glassmorphism 大盘视图重构

**Files:**
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `adminStats`, `activeTab`
- Produces: Beautiful Bento Grid with premium light/dark card designs.

- [ ] **Step 1: 重构管理员统计数据展示逻辑**

当 `user.role === "ADMIN" && activeTab === "stats"` 时渲染。
将之前的 4 个简易 Cards 重构为更具视觉冲击力的 Bento Box：
- **Hero 卡片**：新增顶栏系统总览 Hero Banner，使用精美的蓝色渐变和半透明磨砂质感：
  ```tsx
  <div className="relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-gradient-to-r from-brand/90 to-indigo-600/80 p-6 text-white shadow-md">
    <div className="relative z-10">
      <h2 className="text-lg font-bold">系统全局大盘中心</h2>
      <p className="text-xs text-white/80 mt-1">您可在本页监控全校活动运作、电子门票核销、用户活跃状态，或通过右上角切换至活动工作区直接发布/编辑活动。</p>
    </div>
    <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 bg-radial from-white via-transparent to-transparent pointer-events-none" />
  </div>
  ```
- **Bento 核心数据卡片**：
  使用 `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` 组装：
  - Card 1 (全站用户数)：`col-span-1`
  - Card 2 (活动发布总量)：`col-span-1`
  - Card 3 (门票预订与核销)：`col-span-1 sm:col-span-2`。加宽展示，内置环形/圆角进度条。
  - Card 4 (活动分类总数)：`col-span-1`
  所有的卡片都使用精修的玻璃质感样式：
  `backdrop-blur-md bg-white/70 dark:bg-card/40 border border-border/50 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-brand/20`

- [ ] **Step 2: 重构下方的双列列表区**

- **“最新加入成员”** 与 **“各分类活动占比”**：
  卡片列表使用淡灰色磨砂内层容器包覆。每一项成员拥有毛玻璃圆形头像框，分类占比拥有渐变条。
- **“热门校园活动 Top 5”** 与 **“最新发布活动”**：
  使用 timeline 风或苹果极简排版，配以精美胶囊 Badge 和微小的 Hover 浮动微动画。

- [ ] **Step 3: 关联条件渲染限制**

确保以前的主办方大盘组件 (`DashboardAnalytics` 和 `event-form-panel`) 只在 `(user.role === "ORGANIZER" || (user.role === "ADMIN" && activeTab === "events"))` 时显示！
修改 JSX 控制逻辑：
```tsx
{(user.role === "ORGANIZER" || (user.role === "ADMIN" && activeTab === "events")) && (
  // 渲染主办方数据分析与活动发布/管理列表
)}
```

- [ ] **Step 4: 运行类型检查与测试验证**

运行命令：
```bash
pnpm typecheck
pnpm test
```
Expected: 所有的 TypeScript 类型及测试套件全部通过。

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "style: 管理员大盘升级为高级的 Bento Grid + 玻璃质感交互界面"
```
