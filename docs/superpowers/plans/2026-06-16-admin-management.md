# 活动分类与账号管理功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 EventFlow 系统添加活动分类管理与账号管理子路由页面，供系统管理员（ADMIN）进行增删改查管理。

**Architecture:** 采用 Next.js App Router 子路由架构，创建 `/dashboard/categories` 和 `/dashboard/accounts` 独立页面，通过角色校验进行路由保护；后端提供相应的 API 路由端点进行数据存取，保证与现有系统的数据库模型最大兼容。

**Tech Stack:** Next.js (React), Prisma, Better-SQLite3, Tailwind CSS, Lucide-React, Shadcn components.

---

### Task 1: 数据库模型与种子数据更新

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Test: `tests/categories.test.ts`

- [ ] **Step 1: 在 `prisma/schema.prisma` 中添加 Category 模型**

修改 [prisma/schema.prisma](file:///D:/Desktop/javaweb/event-flow/prisma/schema.prisma) 并新增 `Category` 实体，同时保持 `Event` 模型的 `category` 为 `String` 不变以保证向后兼容性。

```prisma
// 在 schema.prisma 末尾追加模型：
model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: 运行数据库更新命令**

在项目根目录下，使用终端运行 `prisma db push` 将更新推送到 SQLite 数据库中。

运行：
```powershell
npx prisma db push --accept-data-loss
```
Expected: 数据库表更新成功，生成新的 Prisma Client。

- [ ] **Step 3: 更新种子数据脚本 `prisma/seed.ts`**

修改 [prisma/seed.ts](file:///D:/Desktop/javaweb/event-flow/prisma/seed.ts)，在最开始导入初始分类以避免后续引用失败。

在 `prisma/seed.ts` 文件的 `main()` 函数清理数据部分：
```typescript
  // 在 5-9 行附近清理数据处，添加对分类的清理：
  await prisma.ticket.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({}); // 新增清理

  // 创建初始分类
  await prisma.category.createMany({
    data: [
      { name: "学术讲座" },
      { name: "文体比赛" },
      { name: "社团活动" },
    ]
  });
```

- [ ] **Step 4: 执行数据库填充脚本**

运行：
```powershell
npx prisma db seed
```
Expected: 种子数据成功导入，包括 3 个默认活动分类。

- [ ] **Step 5: 编写测试脚本验证分类数据**

创建新测试文件 [tests/categories.test.ts](file:///D:/Desktop/javaweb/event-flow/tests/categories.test.ts)：
```typescript
import assert from "node:assert";
import test from "node:test";
import { prisma } from "../lib/db";

test("活动分类数据库测试", async () => {
  // 查询种子分类
  const cats = await prisma.category.findMany();
  assert.ok(cats.length >= 3);
  const names = cats.map(c => c.name);
  assert.ok(names.includes("学术讲座"));
  assert.ok(names.includes("文体比赛"));
  assert.ok(names.includes("社团活动"));

  // 新增分类
  const newCat = await prisma.category.create({
    data: { name: "科创沙龙" }
  });
  assert.strictEqual(newCat.name, "科创沙龙");

  // 清理新增分类
  await prisma.category.delete({ where: { id: newCat.id } });
});
```

运行测试：
```powershell
npm run test
```
Expected: 所有测试（包括新写的 `categories.test.ts`）都通过。

- [ ] **Step 6: 提交代码**

运行：
```bash
git add prisma/schema.prisma prisma/seed.ts tests/categories.test.ts
git commit -m "feat: 数据库结构新增 Category 模型并编写相应测试"
```

---

### Task 2: 活动分类后端 API 实现

**Files:**
- Create: `app/api/categories/route.ts`

- [ ] **Step 1: 实现分类 API 端点**

创建 [app/api/categories/route.ts](file:///D:/Desktop/javaweb/event-flow/app/api/categories/route.ts) 文件并填入以下代码，包含完整的权限校验（只有 `ADMIN` 才能执行写操作）和删除关联校验：

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 辅助函数：校验操作人是否为管理员
async function verifyAdmin(adminId: string | null) {
  if (!adminId) return false;
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  return user?.role === "ADMIN";
}

export async function GET(req: Request) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId, name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "分类名称不能为空" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    // 重名检查
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ success: false, message: "该分类名称已存在" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    const body = await req.json();
    const { adminId, name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "分类名称不能为空" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    // 重名检查（排除自身）
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ success: false, message: "该分类名称已存在" }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const adminId = searchParams.get("adminId");

    if (!id) {
      return NextResponse.json({ success: false, message: "分类ID缺失" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ success: false, message: "分类不存在" }, { status: 404 });
    }

    // 安全检查：是否有活动正在关联该分类
    const associatedEventsCount = await prisma.event.count({
      where: { category: category.name },
    });

    if (associatedEventsCount > 0) {
      return NextResponse.json({
        success: false,
        message: `无法删除分类：当前已有 ${associatedEventsCount} 个活动正在使用该分类，请先修改这些活动所属的分类。`
      }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "分类删除成功" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 编写测试用例验证分类 API**

在 [tests/categories.test.ts](file:///D:/Desktop/javaweb/event-flow/tests/categories.test.ts) 中追加 API 的单元测试，可直接使用 Prisma 进行模拟：

```typescript
// 在 tests/categories.test.ts 末尾添加模拟权限验证测试：
test("分类 API 逻辑校验", async () => {
  // 获取一个非 ADMIN 用户
  let user = await prisma.user.findFirst({ where: { role: "USER" } });
  if (!user) {
    user = await prisma.user.create({
      data: { name: "Student", email: "stu@campus.com", password: "123", role: "USER" }
    });
  }

  // 模拟非法用户操作分类
  const isUserAdmin = user.role === "ADMIN";
  assert.strictEqual(isUserAdmin, false, "普通学生不应具备管理员身份");
});
```

- [ ] **Step 3: 运行测试**

运行：
```powershell
npm run test
```
Expected: 测试全部通过。

- [ ] **Step 4: 提交代码**

运行：
```bash
git add app/api/categories/route.ts tests/categories.test.ts
git commit -m "feat: 实现活动分类 CRUD 的 API 路由并完成测试"
```

---

### Task 3: 系统账号管理后端 API 实现

**Files:**
- Create: `app/api/users/route.ts`
- Create: `tests/users-management.test.ts`

- [ ] **Step 1: 实现账号管理 API 端点**

创建 [app/api/users/route.ts](file:///D:/Desktop/javaweb/event-flow/app/api/users/route.ts) 文件并填入以下代码，包含密码加密（使用 `bcryptjs`）以及账号管理操作逻辑：

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

async function verifyAdmin(adminId: string | null) {
  if (!adminId) return false;
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  return user?.role === "ADMIN";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }
    if (role !== "all") {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId, name, email, role, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ success: false, message: "姓名、邮箱和角色必填" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    // 唯一性校验
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, message: "该邮箱账号已被注册" }, { status: 400 });
    }

    const rawPassword = password || "admin123";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    const body = await req.json();
    const { adminId, name, email, role, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ success: false, message: "必填字段缺失" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    // 唯一性检查
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ success: false, message: "该邮箱已被其他账号使用" }, { status: 400 });
    }

    const data: any = { name, email, role };
    if (password && password.trim()) {
      data.password = await bcrypt.hash(password.trim(), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const adminId = searchParams.get("adminId");

    if (!id) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    if (id === adminId) {
      return NextResponse.json({ success: false, message: "无法删除当前登录的管理员账号" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "用户账号删除成功" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 编写测试脚本验证用户管理数据库操作**

创建新测试文件 [tests/users-management.test.ts](file:///D:/Desktop/javaweb/event-flow/tests/users-management.test.ts)：
```typescript
import assert from "node:assert";
import test from "node:test";
import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

test("账号管理后台流程测试", async () => {
  const email = "temp-admin-test@campus.com";
  // 清理现有测试数据
  await prisma.user.deleteMany({ where: { email } });

  // 1. 创建测试用户
  const pwd = await bcrypt.hash("pwd123", 10);
  const user = await prisma.user.create({
    data: {
      name: "临时测试账号",
      email,
      password: pwd,
      role: "ORGANIZER"
    }
  });

  assert.strictEqual(user.name, "临时测试账号");
  assert.strictEqual(user.role, "ORGANIZER");

  // 2. 更新用户信息
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: "修改后的账号",
      role: "USER"
    }
  });
  assert.strictEqual(updatedUser.name, "修改后的账号");
  assert.strictEqual(updatedUser.role, "USER");

  // 3. 删除用户
  await prisma.user.delete({ where: { id: user.id } });
  const check = await prisma.user.findUnique({ where: { id: user.id } });
  assert.strictEqual(check, null);
});
```

- [ ] **Step 3: 运行测试**

运行：
```powershell
npm run test
```
Expected: 测试全部通过。

- [ ] **Step 4: 提交代码**

运行：
```bash
git add app/api/users/route.ts tests/users-management.test.ts
git commit -m "feat: 实现账号管理 CRUD 接口并编写相应测试"
```

---

### Task 4: 活动探索主页和控制台的分类加载动态化

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: 使 `app/page.tsx` 动态加载分类**

修改 [app/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/page.tsx)，使用 state 存储分类列表，并在挂载时调用 API 加载分类以作为筛选选项：

```typescript
// 替换第 12 行起的 State 声明：
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [keyword, setKeyword] = useState<string>("")
  const [dbCategories, setDbCategories] = useState<string[]>([])

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories")
        const data = await res.json()
        if (Array.isArray(data)) {
          setDbCategories(["", ...data.map((c: any) => c.name)])
        } else {
          setDbCategories(["", "学术讲座", "文体比赛", "社团活动"])
        }
      } catch {
        setDbCategories(["", "学术讲座", "文体比赛", "社团活动"])
      }
    }
    fetchCats()
  }, [])

// 替换第 65-76 行的原 map 逻辑：
      <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
        {dbCategories.map((cat) => (
          <Button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="h-9 rounded-xl px-4 text-sm font-semibold"
          >
            {cat || "全部活动"}
          </Button>
        ))}
      </div>
```

- [ ] **Step 2: 修改 `app/dashboard/page.tsx` 中发布表单的分类逻辑**

修改 [app/dashboard/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/dashboard/page.tsx)，支持动态分类。

在 `app/dashboard/page.tsx` 中添加一个 state：
```typescript
  // 在 107 行附近添加
  const [dbCategories, setDbCategories] = useState<{ label: string; value: string }[]>([])

  // 在 438 行附近组件初始化 useEffect 中，增加分类拉取逻辑：
  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (!stored) {
      window.location.href = "/login"
      return
    }
    const curr = JSON.parse(stored)
    setTimeout(() => {
      setUser(curr)
      loadDashboardData(curr)
    }, 0)

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        const data = await res.json()
        if (Array.isArray(data)) {
          setDbCategories(data.map((c: any) => ({ label: c.name, value: c.name })))
        }
      } catch (err) {
        console.error("加载动态分类失败:", err)
      }
    }
    fetchCategories()
  }, [])
```

在组件的活动表单中将静态 `categories` 替换为动态获取的：
```typescript
  // 在 786-803 行附近修改渲染：
  const renderCategories = dbCategories.length > 0 ? dbCategories : categories;
```
并且把表单的 Select 组件的 `items` 和 map 改为 `renderCategories`。

- [ ] **Step 3: 提交代码**

运行：
```bash
git add app/page.tsx app/dashboard/page.tsx
git commit -m "style: 将主页与控制台活动创建表单改为动态拉取活动分类"
```

---

### Task 5: 管理员控制台快捷管理入口

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: 在主控制台页为管理员添加分类与账号管理的快捷入口**

修改 [app/dashboard/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/dashboard/page.tsx) 596-605 行附近的返回布局，如果是 `ADMIN`，在欢迎区域下方动态添加指向子路由的卡片：

```typescript
// 寻找 596-605 行附近代码：
      <div className="flex items-center justify-between border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">个人控制台</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            欢迎回来，{user.name} ({user.role === "USER" ? "学生" : "主办方"})
          </p>
        </div>
      </div>

// 修改为：
      <div className="flex flex-col gap-6 border-b border-border/60 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">个人控制台</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              欢迎回来，{user.name} ({user.role === "USER" ? "学生" : user.role === "ADMIN" ? "系统管理员" : "主办方"})
            </p>
          </div>
        </div>
        
        {user.role === "ADMIN" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/categories" className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:bg-muted/50 transition-colors">
              <div>
                <h3 className="font-bold text-foreground">活动分类管理</h3>
                <p className="mt-1 text-xs text-muted-foreground">对校园活动类型进行创建、重命名或删除维护</p>
              </div>
              <span className="text-xl font-bold text-muted-foreground/50">📂</span>
            </Link>
            <Link href="/dashboard/accounts" className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:bg-muted/50 transition-colors">
              <div>
                <h3 className="font-bold text-foreground">系统账号管理</h3>
                <p className="mt-1 text-xs text-muted-foreground">新建、修改、重置密码及移除系统账号</p>
              </div>
              <span className="text-xl font-bold text-muted-foreground/50">👥</span>
            </Link>
          </div>
        )}
      </div>
```
注意要在文件顶部引入 `import Link from "next/link"`。

- [ ] **Step 2: 提交代码**

运行：
```bash
git add app/dashboard/page.tsx
git commit -m "style: 为系统管理员添加分类与账号管理快捷卡片"
```

---

### Task 6: 活动分类管理前端界面实现

**Files:**
- Create: `app/dashboard/categories/page.tsx`

- [ ] **Step 1: 新建分类管理页面文件并写入完整代码**

创建 [app/dashboard/categories/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/dashboard/categories/page.tsx) 页面文件，包含以下内容：
- 用户身份保护：非管理员重定向。
- 采用 UI 的规范：表格、弹窗表单（新增/修改）。

代码如下：
```typescript
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CategoryType {
  id: string;
  name: string;
  createdAt: string;
}

export default function CategoriesManagement() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("campus_user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    const curr = JSON.parse(stored);
    if (curr.role !== "ADMIN") {
      toast.error("您不是管理员，无权访问此页面！");
      window.location.href = "/dashboard";
      return;
    }
    setAdminUser(curr);
    loadCategories(curr.id);
  }, []);

  const loadCategories = async (adminId: string) => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch {
      toast.error("加载分类数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentName.trim() || !adminUser) return;
    setSubmitting(true);

    try {
      const url = editingId ? `/api/categories?id=${editingId}` : "/api/categories";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: adminUser.id, name: currentName }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "修改分类成功" : "新增分类成功");
        setDialogOpen(false);
        setCurrentName("");
        setEditingId(null);
        loadCategories(adminUser.id);
      } else {
        toast.error(data.message || "保存失败");
      }
    } catch {
      toast.error("网络故障，操作失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (cat: CategoryType) => {
    setEditingId(cat.id);
    setCurrentName(cat.name);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!adminUser) return;
    try {
      const res = await fetch(`/api/categories?id=${id}&adminId=${adminUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("删除分类成功");
        loadCategories(adminUser.id);
      } else {
        toast.error(data.message || "删除分类失败");
      }
    } catch {
      toast.error("网络错误，删除分类失败");
    }
  };

  if (loading || !adminUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> 返回控制台
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">活动分类管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">在此处新增、编辑或删除校园活动选项卡及分类标签。</p>
          </div>
          <Button
            onClick={() => {
              setEditingId(null);
              setCurrentName("");
              setDialogOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="size-4" /> 添加分类
          </Button>
        </div>

        {/* 分类数据列表 */}
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/70 text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4">分类名称</th>
                <th className="p-4">创建时间</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {categories.map((cat) => (
                <tr key={cat.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-4 font-semibold">{cat.name}</td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(cat.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(cat)}
                        className="h-8 px-2 text-xs"
                      >
                        <Pencil className="size-3 mr-1" /> 编辑
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-3 mr-1" /> 删除
                            </Button>
                          }
                        />
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除该活动分类吗？</AlertDialogTitle>
                            <AlertDialogDescription>
                              此操作将永久删除分类“{cat.name}”。若该分类下当前存在活动关联，系统将拦截删除以防止数据产生异常。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cat.id)}>
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    暂无活动分类数据，请点击右上角添加。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 弹窗模态框 */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-foreground">
              {editingId ? "编辑活动分类" : "添加活动分类"}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>分类名称</FieldLabel>
                  <Input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    required
                    placeholder="请输入分类名称，如：户外拓展"
                    className="bg-background"
                  />
                </Field>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingId(null);
                      setCurrentName("");
                    }}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "正在保存..." : "保存"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 提交代码**

运行：
```bash
git add app/dashboard/categories/page.tsx
git commit -m "feat: 实现分类管理前端列表和 CRUD 弹窗操作界面"
```

---

### Task 7: 系统账号管理前端界面实现

**Files:**
- Create: `app/dashboard/accounts/page.tsx`

- [ ] **Step 1: 新建账号管理页面文件并写入完整代码**

创建 [app/dashboard/accounts/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/dashboard/accounts/page.tsx) 页面文件，包含以下内容：
- 用户身份保护。
- 搜索词和角色选择过滤条。
- 用户数据表。
- “新建用户”和“编辑/重置密码”弹窗对话框。
- 删除账号的二次警告。

代码如下：
```typescript
"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const roleOptions = [
  { label: "管理员", value: "ADMIN" },
  { label: "活动组织者", value: "ORGANIZER" },
  { label: "普通学生", value: "USER" },
];

const filterRoleOptions = [
  { label: "全部角色", value: "all" },
  ...roleOptions,
];

export default function AccountsManagement() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 表单字段
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [password, setPassword] = useState("");

  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const stored = localStorage.getItem("campus_user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    const curr = JSON.parse(stored);
    if (curr.role !== "ADMIN") {
      toast.error("您不是管理员，无权访问此页面！");
      window.location.href = "/dashboard";
      return;
    }
    setAdminUser(curr);
    loadUsers(curr.id, searchQuery, roleFilter);
  }, [searchQuery, roleFilter]);

  const loadUsers = async (adminId: string, search: string, roleVal: string) => {
    try {
      const res = await fetch(`/api/users?adminId=${adminId}&search=${encodeURIComponent(search)}&role=${roleVal}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch {
      toast.error("获取账号列表数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setRole("USER");
    setPassword("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (user: UserType) => {
    setEditingId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword(""); // 编辑时不强制输入密码
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !role || !adminUser) return;
    setSubmitting(true);

    try {
      const url = editingId ? `/api/users?id=${editingId}` : "/api/users";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: adminUser.id,
          name: name.trim(),
          email: email.trim(),
          role,
          password: password.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "修改资料成功" : "创建账号成功");
        setDialogOpen(false);
        loadUsers(adminUser.id, searchQuery, roleFilter);
      } else {
        toast.error(data.message || "操作失败");
      }
    } catch {
      toast.error("网络连接失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!adminUser) return;
    try {
      const res = await fetch(`/api/users?id=${id}&adminId=${adminUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("账号删除成功");
        loadUsers(adminUser.id, searchQuery, roleFilter);
      } else {
        toast.error(data.message || "删除账号失败");
      }
    } catch {
      toast.error("删除账号接口错误");
    }
  };

  if (loading || !adminUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> 返回控制台
          </Link>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">系统账号管理</h1>
            <p className="mt-1 text-sm text-muted-foreground">在此对系统内部的管理员（ADMIN）、主办方（ORGANIZER）和普通学生（USER）进行维护。</p>
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 self-start sm:self-auto">
            <Plus className="size-4" /> 新建账号
          </Button>
        </div>

        {/* 筛选与搜索工具条 */}
        <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 sm:flex-row sm:items-center">
          <Input
            type="text"
            placeholder="搜索姓名、邮箱"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full bg-background text-sm sm:w-64"
          />
          <Select
            value={roleFilter}
            onValueChange={(val) => setRoleFilter(val || "all")}
            items={filterRoleOptions}
          >
            <SelectTrigger className="h-9 w-40 bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-md">
              <SelectGroup>
                {filterRoleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* 用户列表表格 */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/70 text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4">姓名</th>
                <th className="p-4">邮箱 (账号)</th>
                <th className="p-4">角色</th>
                <th className="p-4">注册时间</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-foreground">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted/30">
                  <td className="p-4 font-semibold">{u.name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.role === "ADMIN"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
                          : u.role === "ORGANIZER"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
                      }`}
                    >
                      {u.role === "ADMIN" ? "管理员" : u.role === "ORGANIZER" ? "组织者" : "普通学生"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEdit(u)} className="h-8 px-2 text-xs">
                        <Pencil className="size-3 mr-1" /> 编辑
                      </Button>
                      {u.id !== adminUser.id ? (
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-3 mr-1" /> 删除
                              </Button>
                            }
                          />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-destructive">确认删除该系统账号吗？</AlertDialogTitle>
                              <AlertDialogDescription className="text-left">
                                <span className="font-bold text-destructive">⚠️ 警告：</span>
                                删除账号“{u.name} ({u.email})”将执行级联删除。这会同步彻底删除其发布的全部活动、历史门票记录等。此操作具有极高数据风险，且无法恢复。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(u.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                确认强行删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    未找到匹配的系统用户。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新建/编辑账号弹窗 */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-foreground">
              {editingId ? "编辑系统账号资料" : "新建系统账号"}
            </h3>
            <form onSubmit={handleSubmit} className="mt-4">
              <FieldGroup>
                <Field>
                  <FieldLabel>姓名/名称</FieldLabel>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="姓名或协会名称"
                    className="bg-background"
                  />
                </Field>
                <Field>
                  <FieldLabel>电子邮箱 (登录账号)</FieldLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="username@domain.com"
                    className="bg-background"
                  />
                </Field>
                <Field>
                  <FieldLabel>系统角色</FieldLabel>
                  <Select value={role} onValueChange={(val) => setRole(val || "USER")} items={roleOptions}>
                    <SelectTrigger className="w-full bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-md">
                      <SelectGroup>
                        {roleOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>
                    {editingId ? "重置密码 (留空则不修改)" : "登录密码 (留空默认为 admin123)"}
                  </FieldLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={editingId ? "输入新密码" : "默认为 admin123"}
                    className="bg-background"
                  />
                </Field>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingId(null);
                    }}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "正在保存..." : "确认"}
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 提交代码**

运行：
```bash
git add app/dashboard/accounts/page.tsx
git commit -m "feat: 实现系统账号管理前端列表、搜索/筛选和 CRUD 表单"
```
