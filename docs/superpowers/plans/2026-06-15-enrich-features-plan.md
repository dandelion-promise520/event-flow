# EventFlow 功能丰富化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 EventFlow 系统实现组织者明细看板与 CSV 导出、闭环活动评价与评分系统、站内消息与通知中心（含群发广播）。

**Architecture:** 
1. 在 Prisma Schema 中扩展模型并执行数据库迁移，更新种子数据。
2. 编写基于 Node.js 原生测试运行器的 API 测试用例。
3. 实现相关的 API 端点，并使订票、核销操作能够自动触发站内信通知。
4. 开发前端 React 组件，包括通知中心弹出框、活动详情页评价表单与列表、组织者看板选项卡与 CSV 导出、群发广播对话框。

**Tech Stack:** Next.js 16 (App Router), Prisma, SQLite, Tailwind CSS v4, Lucide React, Shadcn UI

---

### Task 1: 数据库 Schema 扩展与迁移

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Create: `tests/schema.test.ts`

- [ ] **Step 1: 编写 Schema 验证测试**
  在 `tests/schema.test.ts` 中编写测试，通过 Prisma 客户端查询新增的模型，确保在未应用迁移时测试无法通过：
  ```typescript
  import assert from "node:assert";
  import test from "node:test";
  import { prisma } from "../lib/db";

  test("数据库新增模型查询验证", async () => {
    // 尝试查询 reviews，期望失败（未迁移时无此模型）
    try {
      await (prisma as any).review.findMany();
      assert.fail("未应用 schema 变更前不应该能查询 review 模型");
    } catch (e: any) {
      assert.ok(e.message.includes("does not exist") || e.message.includes("Unknown model") || true);
    }

    // 尝试查询 notifications，期望失败
    try {
      await (prisma as any).notification.findMany();
      assert.fail("未应用 schema 变更前不应该能查询 notification 模型");
    } catch (e: any) {
      assert.ok(e.message.includes("does not exist") || e.message.includes("Unknown model") || true);
    }
  });
  ```

- [ ] **Step 2: 运行测试验证失败**
  运行：`pnpm test`
  期望：`tests/schema.test.ts` 中 `assert.fail` 触发或编译失败，测试未完全通过。

- [ ] **Step 3: 扩展 Prisma Schema**
  在 `prisma/schema.prisma` 尾部追加模型，并更新 `User` 和 `Event`：
  ```prisma
  // 修改 User 模型，增加关联关系：
  model User {
    id        String   @id @default(uuid())
    email     String   @unique
    name      String
    password  String
    role      String   @default("USER") // "ADMIN", "ORGANIZER", "USER"
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    events    Event[]  @relation("CreatedEvents")
    tickets   Ticket[]
    reviews   Review[]
    notifications Notification[]
  }

  // 修改 Event 模型，增加关联关系：
  model Event {
    id          String   @id @default(uuid())
    title       String
    description String
    coverUrl    String?
    location    String
    startTime   DateTime
    endTime     DateTime
    capacity    Int
    price       Float    @default(0.0)
    category    String
    status      String   @default("ACTIVE")
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    organizerId String
    organizer   User     @relation("CreatedEvents", fields: [organizerId], references: [id], onDelete: Cascade)
    tickets     Ticket[]
    reviews     Review[]
  }

  // 新增 Review 模型
  model Review {
    id        String   @id @default(uuid())
    rating    Int      // 1 至 5 评分
    content   String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    userId    String
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    eventId   String
    event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

    @@unique([userId, eventId])
  }

  // 新增 Notification 模型
  model Notification {
    id        String   @id @default(uuid())
    title     String
    content   String
    isRead    Boolean  @default(false)
    createdAt DateTime @default(now())

    userId    String
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }
  ```

- [ ] **Step 4: 执行数据库迁移与重置**
  使用 Prisma CLI 重新生成并推送架构：
  运行：`pnpm exec prisma db push`
  期望：成功应用 Schema，并重新生成 Prisma Client。

- [ ] **Step 5: 更新 Seed 种子数据**
  修改 `prisma/seed.ts`，在种子脚本末尾为测试账号添加一条已核销门票对应的评价和一些站内通知。
  打开 `prisma/seed.ts`，在 `main()` 函数最后面追加：
  ```typescript
  // 查找一个已核销的门票
  const usedTicket = await prisma.ticket.findFirst({
    where: { status: "USED" },
    include: { event: true, user: true }
  });

  if (usedTicket) {
    // 写入评价种子数据
    await prisma.review.upsert({
      where: { userId_eventId: { userId: usedTicket.userId, eventId: usedTicket.eventId } },
      update: {},
      create: {
        rating: 5,
        content: "非常好的活动，收获满满！",
        userId: usedTicket.userId,
        eventId: usedTicket.eventId
      }
    });

    // 写入通知种子数据
    await prisma.notification.create({
      data: {
        title: "门票核销成功通知",
        content: `您的《${usedTicket.event.title}》门票已成功核销。欢迎在活动页面撰写您的评价！`,
        userId: usedTicket.userId,
        isRead: false
      }
    });
  }
  ```
  运行：`pnpm exec prisma db seed`
  期望：种子数据成功载入，无报错。

- [ ] **Step 6: 修改测试文件并验证通过**
  更新 `tests/schema.test.ts` 以断言表内至少存在上述写入的数据：
  ```typescript
  import assert from "node:assert";
  import test from "node:test";
  import { prisma } from "../lib/db";

  test("数据库新增模型查询验证", async () => {
    const reviews = await prisma.review.findMany();
    assert.ok(reviews.length >= 1, "应该至少有一条评价种子数据");

    const notifications = await prisma.notification.findMany();
    assert.ok(notifications.length >= 1, "应该至少有一条通知种子数据");
  });
  ```
  运行：`pnpm test`
  期望：所有测试通过。

- [ ] **Step 7: 提交代码**
  运行：
  ```bash
  git add prisma/schema.prisma prisma/seed.ts tests/schema.test.ts
  git commit -m "feat: 扩展 Prisma 数据库架构并填充种子数据"
  ```

---

### Task 2: 站内消息与通知中心 API 及业务钩子集成

**Files:**
- Create: `app/api/notifications/route.ts`
- Create: `app/api/notifications/read/route.ts`
- Modify: `app/api/tickets/route.ts`
- Modify: `app/api/tickets/checkin/route.ts`
- Create: `tests/notifications.test.ts`

- [ ] **Step 1: 编写集成测试**
  创建 `tests/notifications.test.ts`，测试通知获取、已读更新、购票核销自动触发逻辑：
  ```typescript
  import assert from "node:assert";
  import test from "node:test";
  import { prisma } from "../lib/db";

  test("站内信通知获取、已读状态更新以及自动触发逻辑测试", async () => {
    // 1. 获取一个测试用户
    let user = await prisma.user.findFirst({ where: { role: "USER" } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: "notify-test@campus.com", name: "Notify Test User", password: "123" }
      });
    }

    // 2. 清理其历史通知
    await prisma.notification.deleteMany({ where: { userId: user.id } });

    // 3. 手动向其插入一条通知，测试 GET 接口
    const n = await prisma.notification.create({
      data: { title: "系统公告", content: "欢迎来到票务系统", userId: user.id }
    });

    // 模拟 GET 请求拉取接口
    const getRes = await fetch(`http://localhost:3000/api/notifications?userId=${user.id}`);
    assert.strictEqual(getRes.status, 200);
    const notifications = await getRes.json();
    assert.ok(notifications.length >= 1);
    assert.strictEqual(notifications[0].title, "系统公告");
    assert.strictEqual(notifications[0].isRead, false);

    // 4. 测试 POST 标记已读接口
    const readRes = await fetch("http://localhost:3000/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ids: [n.id] })
    });
    assert.strictEqual(readRes.status, 200);
    const readData = await readRes.json();
    assert.strictEqual(readData.success, true);

    // 再次查询校验已读
    const nUpdated = await prisma.notification.findUnique({ where: { id: n.id } });
    assert.strictEqual(nUpdated?.isRead, true);
  });
  ```

- [ ] **Step 2: 运行测试验证失败**
  启动开发服务：确保 `pnpm dev` 处于开启状态。
  运行：`pnpm test`
  期望：由于 API 还未实现，测试抛出 Connection Refused 或 404 错误。

- [ ] **Step 3: 实现获取通知 API**
  创建 `app/api/notifications/route.ts`：
  ```typescript
  import { NextResponse } from "next/server";
  import { prisma } from "@/lib/db";

  export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get("userId");
      if (!userId) {
        return NextResponse.json({ success: false, message: "用户ID不能为空" }, { status: 400 });
      }

      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json(notifications);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  }
  ```

- [ ] **Step 4: 实现标记已读 API**
  创建 `app/api/notifications/read/route.ts`：
  ```typescript
  import { NextResponse } from "next/server";
  import { prisma } from "@/lib/db";

  export async function POST(req: Request) {
    try {
      const { userId, ids } = await req.json();
      if (!userId) {
        return NextResponse.json({ success: false, message: "用户ID不能为空" }, { status: 400 });
      }

      if (Array.isArray(ids) && ids.length > 0) {
        await prisma.notification.updateMany({
          where: { userId, id: { in: ids } },
          data: { isRead: true },
        });
      } else {
        // 一键标已读
        await prisma.notification.updateMany({
          where: { userId },
          data: { isRead: true },
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  }
  ```

- [ ] **Step 5: 集成业务触发钩子 (订票 & 核销时写通知)**
  在 `app/api/tickets/route.ts` 的 `POST` (订票成功后，在 `return NextResponse.json({ success: true, ticket });` 之前) 插入通知写入：
  ```typescript
  // 写入购票通知
  await prisma.notification.create({
    data: {
      title: "🎫 购票成功通知",
      content: `您已成功报名活动。您的电子核销码为: ${ticketCode}，请凭此码入场。`,
      userId,
    },
  });
  ```

  在 `app/api/tickets/checkin/route.ts` 的 `POST` (核销更新状态成功后，即 `await prisma.ticket.update({ ... });` 之后) 插入通知写入：
  ```typescript
  // 写入核销通知
  await prisma.notification.create({
    data: {
      title: "✅ 门票核销成功",
      content: `您的《${ticket.event.title}》门票已成功核销。欢迎在活动详情页撰写您的真实评价！`,
      userId: ticket.userId,
    },
  });
  ```

- [ ] **Step 6: 运行测试验证通过**
  运行：`pnpm test`
  期望：`tests/notifications.test.ts` 测试及其他已有测试全部顺利通过。

- [ ] **Step 7: 提交代码**
  运行：
  ```bash
  git add app/api/notifications/route.ts app/api/notifications/read/route.ts app/api/tickets/route.ts app/api/tickets/checkin/route.ts tests/notifications.test.ts
  git commit -m "feat: 实现站内通知 API 并与订票、核销钩子深度集成"
  ```

---

### Task 3: 活动评价与评分系统 API 实现

**Files:**
- Create: `app/api/events/[id]/reviews/route.ts`
- Create: `tests/reviews.test.ts`

- [ ] **Step 1: 编写评价系统的测试用例**
  创建 `tests/reviews.test.ts`，验证评价权限（只有已核销的购票者可评价，不可重复评价，不可无资质评价）：
  ```typescript
  import assert from "node:assert";
  import test from "node:test";
  import { prisma } from "../lib/db";

  test("活动评价提交、校验及拉取接口测试", async () => {
    // 1. 创建测试用户与活动
    const user = await prisma.user.create({
      data: { email: `review-stu-${Date.now()}@test.com`, name: "Review Student", password: "123" }
    });
    const organizer = await prisma.user.findFirst({ where: { role: "ORGANIZER" } });
    const event = await prisma.event.create({
      data: {
        title: "评价测试活动",
        description: "测试评价",
        location: "新楼",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600 * 1000),
        capacity: 10,
        category: "学术讲座",
        organizerId: organizer!.id
      }
    });

    // 2. 尝试无票评价，期望返回 403 / 400 失败
    const failRes = await fetch(`http://localhost:3000/api/events/${event.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, rating: 5, content: "不错" })
    });
    assert.ok(failRes.status >= 400);
    const failData = await failRes.json();
    assert.strictEqual(failData.success, false);

    // 3. 购票并置状态为 UNUSED，尝试评价，仍期望失败
    const code = `EVT-TEST-${Date.now()}`;
    const ticket = await prisma.ticket.create({
      data: { ticketCode: code, userId: user.id, eventId: event.id, status: "UNUSED" }
    });
    const unusedRes = await fetch(`http://localhost:3000/api/events/${event.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, rating: 5, content: "没去过也要评" })
    });
    assert.ok(unusedRes.status >= 400);

    // 4. 将票更新为 USED (已核销)，期望评价成功
    await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "USED" } });
    const successRes = await fetch(`http://localhost:3000/api/events/${event.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, rating: 4, content: "确实挺好的活动" })
    });
    assert.strictEqual(successRes.status, 200);
    const successData = await successRes.json();
    assert.strictEqual(successData.success, true);

    // 5. 尝试重复评价，期望失败
    const repeatRes = await fetch(`http://localhost:3000/api/events/${event.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, rating: 1, content: "不好" })
    });
    assert.ok(repeatRes.status >= 400);

    // 6. 测试获取评价列表
    const getRes = await fetch(`http://localhost:3000/api/events/${event.id}/reviews`);
    assert.strictEqual(getRes.status, 200);
    const getReviews = await getRes.json();
    assert.ok(getReviews.length >= 1);
    assert.strictEqual(getReviews[0].content, "确实挺好的活动");

    // 清理
    await prisma.event.delete({ where: { id: event.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
  ```

- [ ] **Step 2: 运行测试验证失败**
  运行：`pnpm test`
  期望：`tests/reviews.test.ts` 中的网络请求因为 404 而失败。

- [ ] **Step 3: 实现评价 API 路由**
  创建 `app/api/events/[id]/reviews/route.ts`：
  ```typescript
  import { NextResponse } from "next/server";
  import { prisma } from "@/lib/db";

  // 拉取活动评价列表
  export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: eventId } = await params;
      const reviews = await prisma.review.findMany({
        where: { eventId },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(reviews);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  }

  // 提交活动评价
  export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: eventId } = await params;
      const { userId, rating, content } = await req.json();

      if (!userId || rating === undefined || !content) {
        return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
      }

      if (rating < 1 || rating > 5) {
        return NextResponse.json({ success: false, message: "评分必须在1到5之间" }, { status: 400 });
      }

      // 强校验：是否购票且门票状态为 USED
      const ticket = await prisma.ticket.findFirst({
        where: { userId, eventId, status: "USED" },
      });

      if (!ticket) {
        return NextResponse.json(
          { success: false, message: "仅限购票且核销入场的用户才能撰写评价" },
          { status: 403 }
        );
      }

      // 强校验：是否已经评价过
      const existing = await prisma.review.findUnique({
        where: {
          userId_eventId: { userId, eventId },
        },
      });

      if (existing) {
        return NextResponse.json({ success: false, message: "您已为此活动撰写过评价" }, { status: 400 });
      }

      const review = await prisma.review.create({
        data: {
          rating: parseInt(rating),
          content,
          userId,
          eventId,
        },
      });

      return NextResponse.json({ success: true, review });
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  }
  ```

- [ ] **Step 4: 运行测试验证通过**
  运行：`pnpm test`
  期望：所有的测试全部通过。

- [ ] **Step 5: 提交代码**
  运行：
  ```bash
  git add app/api/events/\[id\]/reviews/route.ts tests/reviews.test.ts
  git commit -m "feat: 实现闭环门票核销活动评价打分 API"
  ```

---

### Task 4: 组织者明细看板与广播通知 API 实现

**Files:**
- Create: `app/api/events/dashboard/route.ts`
- Create: `app/api/events/[id]/broadcast/route.ts`
- Create: `tests/dashboard_broadcast.test.ts`

- [ ] **Step 1: 编写看板与群发广播的集成测试**
  创建 `tests/dashboard_broadcast.test.ts`：
  ```typescript
  import assert from "node:assert";
  import test from "node:test";
  import { prisma } from "../lib/db";

  test("组织者数据看板及消息一键广播测试", async () => {
    // 1. 寻找或创建一个组织者
    let organizer = await prisma.user.findFirst({ where: { role: "ORGANIZER" } });
    if (!organizer) {
      organizer = await prisma.user.create({
        data: { email: "broad-org@test.com", name: "Broad Org", password: "123", role: "ORGANIZER" }
      });
    }

    // 2. 获取该组织者的活动看板，测试 GET 接口
    const dashRes = await fetch(`http://localhost:3000/api/events/dashboard?organizerId=${organizer.id}`);
    assert.strictEqual(dashRes.status, 200);
    const dashData = await dashRes.json();
    assert.ok(Array.isArray(dashData.events));
    assert.ok(Array.isArray(dashData.tickets));

    // 3. 创建一个受众用户，并购买该组织者的活动门票
    const consumer = await prisma.user.create({
      data: { email: `consumer-${Date.now()}@test.com`, name: "Broad Consumer", password: "123" }
    });
    
    // 如果组织者没有活动，先新建一个
    let event = await prisma.event.findFirst({ where: { organizerId: organizer.id } });
    if (!event) {
      event = await prisma.event.create({
        data: {
          title: "广播活动",
          description: "描述",
          location: "教室",
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600 * 1000),
          capacity: 10,
          category: "社团活动",
          organizerId: organizer.id
        }
      });
    }

    await prisma.ticket.create({
      data: { ticketCode: `EVT-B-${Date.now()}`, userId: consumer.id, eventId: event.id }
    });

    // 4. 群发一封广播，验证接口行为
    const broadRes = await fetch(`http://localhost:3000/api/events/${event.id}/broadcast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizerId: organizer.id,
        title: "临时紧急变更通知",
        content: "因雨推迟一小时"
      })
    });
    assert.strictEqual(broadRes.status, 200);
    const broadData = await broadRes.json();
    assert.strictEqual(broadData.success, true);

    // 5. 校验用户是否收到了该广播通知
    const notify = await prisma.notification.findFirst({
      where: { userId: consumer.id, title: "临时紧急变更通知" }
    });
    assert.ok(notify);
    assert.strictEqual(notify.content, "因雨推迟一小时");

    // 清理
    await prisma.ticket.deleteMany({ where: { eventId: event.id } });
    await prisma.user.delete({ where: { id: consumer.id } });
  });
  ```

- [ ] **Step 2: 运行测试验证失败**
  运行：`pnpm test`
  期望：`tests/dashboard_broadcast.test.ts` 因为 404 返回错误。

- [ ] **Step 3: 实现看板明细 API**
  创建 `app/api/events/dashboard/route.ts`：
  ```typescript
  import { NextResponse } from "next/server";
  import { prisma } from "@/lib/db";

  export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const organizerId = searchParams.get("organizerId");

      if (!organizerId) {
        return NextResponse.json({ success: false, message: "组织者ID不能为空" }, { status: 400 });
      }

      // 验证组织者身份
      const organizer = await prisma.user.findUnique({
        where: { id: organizerId },
      });

      if (!organizer || (organizer.role !== "ORGANIZER" && organizer.role !== "ADMIN")) {
        return NextResponse.json({ success: false, message: "无权访问此数据" }, { status: 403 });
      }

      // 1. 获取该组织者名下的所有活动，并聚合售票与核销数据
      const events = await prisma.event.findMany({
        where: { organizerId },
        include: {
          tickets: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedEvents = events.map(e => ({
        id: e.id,
        title: e.title,
        capacity: e.capacity,
        price: e.price,
        soldCount: e.tickets.length,
        checkedInCount: e.tickets.filter(t => t.status === "USED").length,
      }));

      // 2. 获取针对该组织者所有活动已售出的门票明细数据
      const tickets = await prisma.ticket.findMany({
        where: {
          event: {
            organizerId,
          },
        },
        include: {
          event: { select: { title: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { bookedAt: "desc" },
      });

      const formattedTickets = tickets.map(t => ({
        id: t.id,
        eventTitle: t.event.title,
        userName: t.user.name,
        userEmail: t.user.email,
        status: t.status,
        bookedAt: t.bookedAt,
        updatedAt: t.updatedAt,
      }));

      return NextResponse.json({
        events: formattedEvents,
        tickets: formattedTickets,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  }
  ```

- [ ] **Step 4: 实现群发广播通知 API**
  创建 `app/api/events/[id]/broadcast/route.ts`：
  ```typescript
  import { NextResponse } from "next/server";
  import { prisma } from "@/lib/db";

  export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id: eventId } = await params;
      const { organizerId, title, content } = await req.json();

      if (!organizerId || !title || !content) {
        return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
      }

      // 1. 验证活动所有者
      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return NextResponse.json({ success: false, message: "未找到该活动" }, { status: 404 });
      }

      if (event.organizerId !== organizerId) {
        return NextResponse.json({ success: false, message: "无权对非自己创建的活动发布广播" }, { status: 403 });
      }

      // 2. 找出该活动下所有非 CANCELLED 的已购票用户 ID 列表
      const tickets = await prisma.ticket.findMany({
        where: {
          eventId,
          status: { in: ["UNUSED", "USED"] },
        },
        select: {
          userId: true,
        },
      });

      const userIds = Array.from(new Set(tickets.map(t => t.userId)));

      if (userIds.length > 0) {
        // 3. 批量向所有购票用户插入站内信通知
        const notificationsData = userIds.map(userId => ({
          title,
          content,
          userId,
        }));

        await prisma.notification.createMany({
          data: notificationsData,
        });
      }

      return NextResponse.json({ success: true, count: userIds.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      return NextResponse.json({ success: false, message }, { status: 500 });
    }
  }
  ```

- [ ] **Step 5: 运行测试验证通过**
  运行：`pnpm test`
  期望：所有集成测试顺利通过！接口正常响应！

- [ ] **Step 6: 提交代码**
  运行：
  ```bash
  git add app/api/events/dashboard/route.ts app/api/events/\[id\]/broadcast/route.ts tests/dashboard_broadcast.test.ts
  git commit -m "feat: 实现看板明细数据拉取 API 与群发广播消息 API"
  ```

---

### Task 5: 站内消息中心前端 UI (Header popover) 开发

**Files:**
- Create: `components/notification-center.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 编写 NotificationCenter 业务组件**
  使用 `@/components/ui/button` 以及 Lucide 图标库创建消息通知托盘。
  创建 `components/notification-center.tsx`：
  ```tsx
  "use client";

  import { useEffect, useState, useRef } from "react";
  import { Bell, Check, MailOpen, AlertCircle } from "lucide-react";
  import { Button } from "@/components/ui/button";

  interface Notification {
    id: string;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
  }

  export default function NotificationCenter() {
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const fetchNotifications = async (userId: string) => {
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const markAllAsRead = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await res.json();
        if (data.success) {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => {
      const stored = localStorage.getItem("campus_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        fetchNotifications(u.id);
        
        // 轮询（每10秒自动更新一次通知列表）
        const interval = setInterval(() => fetchNotifications(u.id), 10000);
        return () => clearInterval(interval);
      }
    }, []);

    // 点击外部关闭弹窗
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) return null;

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className="relative rounded-full hover:bg-muted"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </Button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-lg border shadow-lg z-50 overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="font-semibold text-sm">站内通知</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> 全部标为已读
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">暂无消息</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 border-b text-xs transition-colors ${
                      n.isRead ? "bg-background" : "bg-muted/40 font-medium"
                    }`}
                  >
                    <div className="flex gap-2 items-start">
                      {n.title.includes("核销") ? (
                        <MailOpen className="h-3.5 w-3.5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-foreground">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground leading-normal">{n.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: 注入全局导航 Layout**
  修改 `app/layout.tsx`。我们需要在 `Header` 导航中右侧引入新模块 `NotificationCenter`。
  打开并查看 `app/layout.tsx` 详情：我们需要把 `NotificationCenter` 添加在退出登录/个人资料等操作按钮旁。
  以下是在全局 Header 中融入 `<NotificationCenter />` 的代码设计：
  ```tsx
  // 在 app/layout.tsx 适当位置引入：
  import NotificationCenter from "@/components/notification-center";

  // 在 Header 部分：
  // <header className="border-b ...">
  //   ...
  //   <div className="flex items-center gap-4">
  //     <NotificationCenter />
  //     ...
  //   </div>
  // </header>
  ```
  *(具体修改将精确定位文件中的 Header 容器替换插入)*

- [ ] **Step 3: 运行静态类型检查并验证**
  运行：`pnpm typecheck`
  期望：无 TypeScript 报错。

- [ ] **Step 4: 提交代码**
  运行：
  ```bash
  git add components/notification-center.tsx app/layout.tsx
  git commit -m "feat: 全局布局中新增站内通知中心下拉框组件"
  ```

---

### Task 6: 活动评价与打分区前端 UI 开发

**Files:**
- Create: `components/review-section.tsx`
- Modify: `app/events/[id]/page.tsx`

- [ ] **Step 1: 编写 ReviewSection 评价组件**
  创建 `components/review-section.tsx`：
  ```tsx
  "use client";

  import { useEffect, useState } from "react";
  import { Star, MessageSquare } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";

  interface Review {
    id: string;
    rating: number;
    content: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }

  interface ReviewSectionProps {
    eventId: string;
  }

  export default function ReviewSection({ eventId }: ReviewSectionProps) {
    const [user, setUser] = useState<{ id: string } | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState("");
    const [canReview, setCanReview] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/reviews`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setReviews(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const checkReviewEligibility = async (userId: string) => {
      try {
        // 校验是否有已使用的门票
        const res = await fetch(`/api/tickets?userId=${userId}&eventId=${eventId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const hasUsed = data.some((t) => t.status === "USED");
          if (hasUsed) {
            // 再检查是否已经发表过评论
            const reviewRes = await fetch(`/api/events/${eventId}/reviews`);
            const reviewsData = await reviewRes.json();
            const alreadyReviewed = reviewsData.some((r: any) => r.userId === userId);
            setCanReview(!alreadyReviewed);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    useEffect(() => {
      fetchReviews();
      const stored = localStorage.getItem("campus_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        checkReviewEligibility(u.id);
      }
    }, [eventId]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setErrorMsg("");
      setSuccessMsg("");

      try {
        const res = await fetch(`/api/events/${eventId}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, rating, content }),
        });
        const data = await res.json();

        if (data.success) {
          setSuccessMsg("评价提交成功！");
          setContent("");
          setCanReview(false);
          fetchReviews();
        } else {
          setErrorMsg(data.message || "提交评价失败");
        }
      } catch (err) {
        setErrorMsg("服务器连接失败");
      }
    };

    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    return (
      <div className="space-y-6 mt-8 pt-8 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" /> 活动评价 ({reviews.length})
          </h3>
          {avgRating && (
            <div className="flex items-center gap-1 text-sm bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium dark:bg-amber-950/20 dark:text-amber-400">
              <Star className="h-4 w-4 fill-amber-500 stroke-amber-500" />
              平均分 {avgRating}
            </div>
          )}
        </div>

        {/* 提交评价区域 */}
        {canReview && (
          <form onSubmit={handleSubmit} className="bg-muted/30 p-4 rounded-lg border space-y-4">
            <div className="font-medium text-sm text-foreground">写下您的活动评价 (仅限参与者)</div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground mr-2">星级评分:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-5 w-5 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 stroke-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请分享您对本次活动的真实看法，例如内容含金量、现场秩序等..."
              required
              className="bg-background"
            />

            {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-green-500">{successMsg}</p>}

            <div className="text-right">
              <Button type="submit" size="sm">提交评价</Button>
            </div>
          </form>
        )}

        {/* 评价列表展示 */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无评价，欢迎参与活动后留言评价！</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{r.user.name}</span>
                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded scale-90 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold">
                      ✓ 已核销用户
                    </span>
                  </div>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= r.rating ? "fill-amber-400 stroke-amber-400" : "text-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{r.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: 在活动详情页嵌入 ReviewSection**
  修改 `app/events/[id]/page.tsx`。
  导入 `<ReviewSection eventId={id} />` 并在活动详细说明及卡片容器的下方合理渲染。

- [ ] **Step 3: 运行类型校验**
  运行：`pnpm typecheck`
  期望：无报错。

- [ ] **Step 4: 提交代码**
  运行：
  ```bash
  git add components/review-section.tsx app/events/\[id\]/page.tsx
  git commit -m "feat: 活动详情页集成打分与文字评价卡片"
  ```

---

### Task 7: 组织者看板数据筛选、CSV 导出与一键群发广播

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: 改造组织者看板数据流与 Tab 结构**
  修改 `app/dashboard/page.tsx`：
  - 增加对看板数据 `tickets` 明细列表的获取：调用 `/api/events/dashboard?organizerId=${user.id}` 获取并存储。
  - 为组织者提供两个 Tabs：“活动管理” 与 “门票核销明细表”。
  - 增加明细表格的筛选字段：活动标题过滤、门票状态过滤、关键词搜索（模糊匹配姓名、邮箱、电子票号）。

- [ ] **Step 2: 实现前端 CSV 导出逻辑**
  在 `page.tsx` 中编写数据导出函数，点击“导出 CSV”时执行：
  ```typescript
  const handleExportCSV = () => {
    // 过滤得到当前表格中的 tickets 数据
    const headers = ["门票编号", "活动名称", "购票人", "联系邮箱", "当前状态", "订票时间"];
    const rows = filteredTickets.map((t) => [
      t.ticketCode,
      t.eventTitle,
      t.userName,
      t.userEmail,
      t.status === "USED" ? "已核销" : t.status === "UNUSED" ? "未使用" : "已取消",
      new Date(t.bookedAt).toLocaleString(),
    ]);

    const csvContent =
      "\uFEFF" + // 添加 UTF-8 BOM，防止 Excel 打开乱码
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `event_tickets_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  ```

- [ ] **Step 3: 增加“群发广播”弹窗和触发机制**
  在组织者看板的活动行中，增加一个“群发通知”按钮。
  点击按钮弹出对话框（使用自定义 Dialog 或直接简单输入框表单），允许输入：
  - 通知标题
  - 通知内容
  - 点击“确定发送”后，调用 `POST /api/events/[id]/broadcast`。
  - 发送完成后显示成功 Toast 或消息提示。

- [ ] **Step 4: 完整构建与测试检查**
  运行：`pnpm build` 及 `pnpm typecheck`
  期望：项目构建完全顺利，没有静态语法和类型缺失。

- [ ] **Step 5: 提交代码**
  运行：
  ```bash
  git add app/dashboard/page.tsx
  git commit -m "feat: 组织者看板实现筛选导出 CSV 与群发广播通知界面"
  ```
