# 重构硬编码暗黑模式与品牌色为语义化变量实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将项目所有页面与组件中硬编码的暗黑模式配色（如 `dark:bg-zinc-950`）和硬编码品牌强调色（如 `text-indigo-600`）重构为基于 CSS 变量的 shadcn/ui 语义化类（如 `bg-card`、`text-brand`），实现在 `app/globals.css` 中一处修改，全局生效。

**Architecture:** 在 `app/globals.css` 的 `@theme inline` 块中加入自定义 brand 别名，并在 `:root` 与 `.dark` 定义 OKLCH 变量。在各 React 组件中，通过替换原始硬编码颜色类为语义化 CSS 变量对应的类完成统一。

**Tech Stack:** Next.js, Tailwind CSS v4, Lucide React

---

### Task 1: 声明全局品牌色 OKLCH 变量

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: 修改全局样式表**
  在 `app/globals.css` 中的 `@theme inline` 下注册别名 `--color-brand` 及 `--color-brand-foreground`；并在 `:root` 与 `.dark` 中分别声明变量值。

  修改 `app/globals.css` 如下：
  ```diff
  @theme inline {
      --font-heading: var(--font-sans);
      --font-sans: var(--font-sans);
  +   --color-brand: var(--brand);
  +   --color-brand-foreground: var(--brand-foreground);
      --color-sidebar-ring: var(--sidebar-ring);
  ```

  并在 `:root` 和 `.dark` 分别注入变量：
  ```diff
  :root {
      --background: oklch(1 0 0);
      --foreground: oklch(0.145 0 0);
      --card: oklch(1 0 0);
  +   --brand: oklch(0.511 0.262 276.966);
  +   --brand-foreground: oklch(0.985 0 0);
      --card-foreground: oklch(0.145 0 0);
  ```

  ```diff
  .dark {
      --background: oklch(0.145 0 0);
      --foreground: oklch(0.985 0 0);
      --card: oklch(0.205 0 0);
  +   --brand: oklch(0.685 0.186 268.036);
  +   --brand-foreground: oklch(0.145 0 0);
      --card-foreground: oklch(0.985 0 0);
  ```

- [ ] **Step 2: 提交**
  ```bash
  git add app/globals.css
  git commit -m "style: 注册全局 brand 主色与 brand-foreground 变量"
  ```

---

### Task 2: 重构主布局与登录页硬编码颜色

**Files:**
- Modify: `app/layout.tsx:31`
- Modify: `app/login/page.tsx:42,43,44,57,68,87`

- [ ] **Step 1: 重构 layout.tsx 中的 body 背景色**
  修改 `app/layout.tsx`：
  ```diff
  -      <body className="min-h-screen bg-[#fcfcfd] dark:bg-background">
  +      <body className="min-h-screen bg-background text-foreground">
  ```

- [ ] **Step 2: 重构 login/page.tsx 中的硬编码卡片、边框、输入框背景**
  修改 `app/login/page.tsx`：
  ```diff
  -      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
  -        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 text-center">系统登录</h2>
  -        <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 text-center">
  +      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
  +        <h2 className="text-xl font-bold text-foreground text-center">系统登录</h2>
  +        <p className="mt-1.5 text-xs text-muted-foreground text-center">
  ```
  以及输入框与页脚：
  ```diff
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
  -               className="bg-white dark:bg-zinc-950"
  +               className="bg-background"
                />
  ```
  ```diff
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
  -               className="bg-white dark:bg-zinc-950"
  +               className="bg-background"
                />
  ```
  ```diff
  -        <div className="mt-6 border-t border-neutral-100 dark:border-neutral-800 pt-6 text-center text-xs text-neutral-400">
  +        <div className="mt-6 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground/80">
  ```

- [ ] **Step 3: 提交**
  ```bash
  git add app/layout.tsx app/login/page.tsx
  git commit -m "style: 重构主布局和登录页的硬编码颜色类"
  ```

---

### Task 3: 重构活动大厅主页

**Files:**
- Modify: `app/page.tsx:38,39,43,46,58,84`

- [ ] **Step 1: 替换主页渐变背景、分类标签、搜索框及空状态文本**
  修改 `app/page.tsx`：
  ```diff
  -      <div className="relative overflow-hidden rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-linear-to-tr from-indigo-50/50 via-white to-pink-50/30 dark:from-indigo-950/20 dark:via-zinc-900 dark:to-pink-950/10 py-12 text-center md:py-20">
  -        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
  +      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-linear-to-tr from-brand/5 via-background to-pink-500/5 dark:from-brand/10 dark:via-card dark:to-pink-500/5 py-12 text-center md:py-20">
  +        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
             <Sparkles className="h-3 w-3" />
             全新上线校园活动大厅
           </span>
  -        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-5xl">
  +        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
             精彩校园活动，一指即达
           </h1>
  -        <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400 md:text-base">
  +        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
             极速报名你感兴趣的学术讲座、文体比赛与社团桌游。电子门票自动生成，入场模拟一键扫码核销。
           </p>
  ```
  ```diff
            <Input
              type="text"
              placeholder="搜索感兴趣的活动..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
  -           className="h-11 w-full rounded-full border border-neutral-200 dark:border-neutral-800 pr-4 pl-10 text-sm shadow-sm transition-all outline-none focus:border-neutral-400 dark:focus:border-neutral-700 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100"
  +           className="h-11 w-full rounded-full border border-border pr-4 pl-10 text-sm shadow-sm transition-all outline-none focus:border-brand/50 bg-background text-foreground"
            />
  ```
  ```diff
  -        <div className="mt-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
  +        <div className="mt-16 text-center text-sm text-muted-foreground">
  ```

- [ ] **Step 2: 提交**
  ```bash
  git add app/page.tsx
  git commit -m "style: 重构活动大厅首页的硬编码颜色类"
  ```

---

### Task 4: 重构 EventCard 组件与顶栏 Navbar

**Files:**
- Modify: `components/event-card.tsx:32,33,45,50,53,55,57,61,67,74,76`
- Modify: `components/navbar.tsx:67,71,73,80,89,96`

- [ ] **Step 1: 修改 components/event-card.tsx 样式**
  修改 `components/event-card.tsx`：
  ```diff
  -    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg">
  -      <div className="aspect-video w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
  +    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:shadow-lg">
  +      <div className="aspect-video w-full bg-muted overflow-hidden relative">
  ```
  ```diff
  -        <span className="absolute left-3 top-3 rounded-full bg-white/95 dark:bg-zinc-900/95 px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-250 shadow-sm">
  +        <span className="absolute left-3 top-3 rounded-full bg-popover/95 px-2.5 py-1 text-xs font-semibold text-foreground/90 shadow-sm">
  ```
  ```diff
  -        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 transition-colors">
  +        <h3 className="font-bold text-foreground group-hover:text-brand line-clamp-1 transition-colors">
  ```
  ```diff
  -        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{event.description}</p>
  -        
  -        <div className="mt-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
  +        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{event.description}</p>
  +        
  +        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
  ```
  ```diff
            <div className="flex items-center gap-1.5">
  -            <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
  +            <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
  -            <MapPin className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
  +            <MapPin className="h-3.5 w-3.5 text-muted-foreground/80" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
  ```
  ```diff
          <div className="mt-6 space-y-1.5">
  -          <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300">
  +          <div className="flex justify-between text-xs font-medium text-muted-foreground">
  ```
  ```diff
  -          <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
  +          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
  -              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
  +              className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
  ```

- [ ] **Step 2: 修改 components/navbar.tsx 样式**
  修改 `components/navbar.tsx`：
  ```diff
  -    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-[#fcfcfd]/80 backdrop-blur-md dark:border-neutral-800 dark:bg-zinc-950/80">
  +    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
         <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
           <Link
             href="/"
  -          className="flex items-center gap-2 text-lg font-bold text-black dark:text-white"
  +          className="flex items-center gap-2 text-lg font-bold text-foreground"
           >
  -          <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
  +          <Calendar className="h-5 w-5 text-brand" />
             <span>EventFlow</span>
           </Link>
           <nav className="flex items-center gap-6">
             <ModeToggle />
             <Link
               href="/"
  -            className="text-sm font-medium text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
  +            className="text-sm font-medium text-muted-foreground hover:text-foreground"
             >
               活动探索
             </Link>
  ```
  ```diff
                <Link
                  href="/dashboard"
  -               className="text-sm font-medium text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
  +               className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  控制台 ({user.name})
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
  -               className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:bg-red-50/50 hover:text-red-800 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
  +               className="flex items-center gap-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut data-icon="inline-start" />
                  退出
  ```

- [ ] **Step 3: 提交**
  ```bash
  git add components/event-card.tsx components/navbar.tsx
  git commit -m "style: 重构 EventCard 和 Navbar 组件的硬编码颜色"
  ```

---

### Task 5: 重构消息中心与活动详情页

**Files:**
- Modify: `components/notification-center.tsx:89,101,102,103,107,114,122,133,138`
- Modify: `app/events/[id]/page.tsx:94,99,101,108,111,113,115,119,120,124,128,129,135,136,139,141,142`

- [ ] **Step 1: 修改 components/notification-center.tsx 样式**
  修改 `components/notification-center.tsx`：
  ```diff
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
  -       className="relative rounded-full hover:bg-muted/80 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
  +       className="relative rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
        >
  ```
  ```diff
        {open && (
  -       <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl z-50 overflow-hidden bg-white dark:bg-zinc-950 animate-in fade-in-50 slide-in-from-top-1 duration-200">
  -         <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-zinc-900/50">
  -           <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">站内通知</span>
  +       <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-xl border border-border shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-200">
  +         <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/50">
  +           <span className="font-semibold text-sm text-foreground/90">站内通知</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
  -               className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors hover:underline flex items-center gap-1 font-medium"
  +               className="text-xs text-brand hover:text-brand/80 transition-colors hover:underline flex items-center gap-1 font-medium"
                >
                  <Check className="h-3.5 w-3.5" /> 全部标为已读
                </button>
              )}
            </div>
  ```
  ```diff
  -          <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
  +          <div className="max-h-72 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">暂无消息</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 text-xs transition-colors ${
  -                   n.isRead ? "bg-white dark:bg-zinc-900 hover:bg-neutral-50/30 dark:hover:bg-zinc-850/30" : "bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 font-medium"
  +                   n.isRead ? "bg-card hover:bg-muted/30" : "bg-brand/10 hover:bg-brand/15 font-medium"
                    }`}
                  >
  ```
  ```diff
                        <div className="flex justify-between items-start gap-1 mb-1">
  -                        <span className="text-neutral-900 dark:text-neutral-100 font-semibold truncate">{n.title}</span>
  +                        <span className="text-foreground font-semibold truncate">{n.title}</span>
                          <span className="text-[10px] text-neutral-400 shrink-0 mt-0.5">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
  -                      <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed break-words">{n.content}</p>
  +                      <p className="text-muted-foreground leading-relaxed break-words">{n.content}</p>
  ```

- [ ] **Step 2: 修改 app/events/[id]/page.tsx 样式**
  修改 `app/events/[id]/page.tsx`：
  ```diff
  -      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white mb-8">
  +      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          返回大厅
        </Link>
  
  -      <div className="overflow-hidden rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900">
  +      <div className="overflow-hidden rounded-3xl border border-border bg-card">
          {event.coverUrl && (
  -         <div className="aspect-[2.39/1] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
  +         <div className="aspect-[2.39/1] w-full bg-muted overflow-hidden">
  ```
  ```diff
            <div className="p-8">
  -          <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
  +          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              {event.category}
            </span>
  -          <h1 className="mt-4 text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">{event.title}</h1>
  +          <h1 className="mt-4 text-2xl md:text-3xl font-extrabold text-foreground">{event.title}</h1>
            
  -          <div className="mt-6 grid gap-4 border-y border-neutral-100 dark:border-neutral-800 py-6 md:grid-cols-2">
  +          <div className="mt-6 grid gap-4 border-y border-border/60 py-6 md:grid-cols-2">
              <div className="flex items-center gap-3">
  -              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
  +              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
  -                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold">开始时间</p>
  -                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{new Date(event.startTime).toLocaleString("zh-CN")}</p>
  +                <p className="text-xs text-muted-foreground/80 font-semibold">开始时间</p>
  +                <p className="text-sm font-bold text-foreground/90">{new Date(event.startTime).toLocaleString("zh-CN")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
  -              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 dark:bg-zinc-800 text-neutral-500 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
  +              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground border border-border">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
  -                <p className="text-xs text-neutral-400 dark:text-neutral-500 font-semibold">活动地点</p>
  -                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{event.location}</p>
  +                <p className="text-xs text-muted-foreground/80 font-semibold">活动地点</p>
  +                <p className="text-sm font-bold text-foreground/90">{event.location}</p>
                </div>
              </div>
            </div>
  ```
  ```diff
            <div className="mt-8">
  -            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">活动介绍</h2>
  -            <p className="mt-3 text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
  +            <h2 className="text-lg font-bold text-foreground">活动介绍</h2>
  +            <p className="mt-3 text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
  
  -          <div className="mt-10 rounded-2xl bg-neutral-50 dark:bg-zinc-800/50 border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
  +          <div className="mt-10 rounded-2xl bg-muted/50 border border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
  -              <p className="text-xs text-neutral-500 dark:text-neutral-400">剩余容量</p>
  -              <p className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
  +              <p className="text-xs text-muted-foreground">剩余容量</p>
  +              <p className="text-lg font-extrabold text-foreground">
                  {event.capacity - event.bookedCount} / {event.capacity} 人
                </p>
              </div>
  ```

- [ ] **Step 3: 提交**
  ```bash
  git add components/notification-center.tsx app/events/\[id\]/page.tsx
  git commit -m "style: 重构消息中心与详情页的硬编码颜色类"
  ```

---

### Task 6: 重构 Dashboard 控制台硬编码颜色

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: 批量重构 dashboard 页面中的硬编码颜色类**
  修改 `app/dashboard/page.tsx`：
  - `text-neutral-900 dark:text-white` -> `text-foreground`
  - `text-neutral-800 dark:text-neutral-200` -> `text-foreground/90`
  - `text-neutral-500 dark:text-neutral-400` -> `text-muted-foreground`
  - `text-neutral-450` / `text-neutral-400 dark:text-neutral-500` -> `text-muted-foreground/80`
  - `bg-white dark:bg-zinc-900` -> `bg-card`
  - `bg-white dark:bg-zinc-950` -> `bg-background`
  - `border-neutral-200 dark:border-neutral-800` -> `border-border`
  - `border-neutral-100 dark:border-neutral-800` -> `border-border/60`
  - `bg-neutral-50 dark:bg-zinc-800` -> `bg-muted`
  - `bg-neutral-50 dark:bg-zinc-950` -> `bg-muted`
  - `bg-neutral-50 dark:bg-zinc-900/50` -> `bg-muted/50`
  - `bg-neutral-50 dark:bg-zinc-800/50` -> `bg-muted/50`
  - `divide-neutral-100 dark:divide-neutral-800` -> `divide-border`
  - 选项卡滑动块：`bg-neutral-900 dark:bg-white` -> `bg-foreground`
  - 选项卡未激活文本悬停：`hover:text-neutral-600 dark:hover:text-neutral-400` -> `hover:text-foreground`
  - 清除日期按钮悬停：`hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800` -> `hover:text-foreground hover:bg-muted`

- [ ] **Step 2: 提交**
  ```bash
  git add app/dashboard/page.tsx
  git commit -m "style: 重构控制台页面的全部硬编码颜色类"
  ```

---

### Task 7: 运行静态代码检查与编译验证

**Files:**
- None

- [ ] **Step 1: 运行 Lint 检查语法和引用**
  运行: `pnpm lint`
  Expected: 无严重 ESLint 错误。

- [ ] **Step 2: 运行 TS 类型检查**
  运行: `pnpm typecheck`
  Expected: 检查通过，TypeScript 编译无报错。

- [ ] **Step 3: 运行测试并尝试构建编译**
  运行: `pnpm test` 和 `pnpm build`
  Expected: 测试全部通过，构建成功生成 `.next` 生产文件。
