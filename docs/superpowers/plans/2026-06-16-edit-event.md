# 活动编辑功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现控制台（Dashboard）中的活动编辑功能，使用户能够修改已发布的活动，并通过 TDD 流程确保前后端逻辑正确。

**Architecture:** 
1. 后端在 `app/api/events/route.ts` 中实现 `PUT` 方法接收更新请求，并在 `tests/events.test.ts` 中添加端到端测试。
2. 前端在 `app/dashboard/page.tsx` 中新增 `editingEventId` 状态，控制表单是在“发布模式”还是“编辑模式”下工作。在编辑模式下，表单支持数据回显、保存修改（发送 PUT 请求）和取消编辑。

**Tech Stack:** Next.js (App Router), Prisma, Tailwind CSS, Lucide Icons, Node.js Test Runner

---

### Task 1: 编写更新活动的 API 接口测试（测试驱动开发 TDD）

**Files:**
- Modify: `tests/events.test.ts`

- [ ] **Step 1: 在测试中编写失败的活动更新测试用例**

在 `tests/events.test.ts` 的 "Events CRUD flow" 中，在查询活动之后、删除数据之前，添加使用 `fetch` 调用 `PUT /api/events` 接口的测试。

```typescript
  // 3. 测试 PUT 接口更新活动
  const updateRes = await fetch(`http://localhost:3000/api/events?id=${event.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Test Hackathon Updated",
      description: "Code, design and win!",
      location: "Lab 404",
      startTime: event.startTime.toISOString(),
      endTime: new Date(event.endTime.getTime() + 3600 * 1000).toISOString(),
      capacity: 60,
      price: 10,
      category: "Academic",
      organizerId: organizer.id
    })
  });
  assert.strictEqual(updateRes.status, 200);
  const updateData = await updateRes.json();
  assert.strictEqual(updateData.success, true);
  assert.strictEqual(updateData.event.title, "Test Hackathon Updated");
  assert.strictEqual(updateData.event.capacity, 60);

  // 验证数据库中是否确实更新
  const dbEvent = await prisma.event.findUnique({ where: { id: event.id } });
  assert.strictEqual(dbEvent?.title, "Test Hackathon Updated");
  assert.strictEqual(dbEvent?.capacity, 60);
```

- [ ] **Step 2: 运行测试并确保它失败**

运行: `pnpm test`
预期结果: 测试失败，因为尚未实现 `PUT` 接口，可能返回 405 Method Not Allowed。

- [ ] **Step 3: 提交修改**

```bash
git add tests/events.test.ts
git commit -m "test: 增加活动更新 PUT 接口测试用例"
```

---

### Task 2: 后端 API 实现 `PUT` 方法

**Files:**
- Modify: `app/api/events/route.ts`

- [ ] **Step 1: 在 `app/api/events/route.ts` 中实现 `PUT` 方法**

修改 `app/api/events/route.ts`，增加 `PUT` 处理逻辑，用于接收更新请求、校验参数、防范开始时间早于当前时间的逻辑（仅在开始时间被修改时校验），并更新数据库。

```typescript
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, coverUrl, location, startTime, endTime, capacity, price, category } = body;

    if (!title || !location || !startTime || !endTime || !capacity || !category) {
      return NextResponse.json({ success: false, message: "必填参数缺失" }, { status: 400 });
    }

    // 检查活动是否存在
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "活动不存在" }, { status: 404 });
    }

    // 校验时间：如果开始时间被修改了，且新时间早于当前时间，则报错
    const newStart = new Date(startTime);
    const oldStart = new Date(existing.startTime);
    if (newStart.getTime() !== oldStart.getTime() && newStart.getTime() - Date.now() < -60 * 1000) {
      return NextResponse.json({ success: false, message: "活动开始时间不能早于当前时间" }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        coverUrl,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity: parseInt(capacity),
        price: parseFloat(price || "0"),
        category,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
```

- [ ] **Step 2: 运行测试并确保它通过**

运行: `pnpm test`
预期结果: 测试全部通过。

- [ ] **Step 3: 提交修改**

```bash
git add app/api/events/route.ts
git commit -m "feat: 实现活动更新 PUT 接口"
```

---

### Task 3: 前端控制台界面支持编辑模式切换与数据回显

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: 新增 `editingEventId` 状态和回显逻辑**

1. 在 `app/dashboard/page.tsx` 组件内定义状态：
   ```typescript
   const [editingEventId, setEditingEventId] = useState<string | null>(null)
   ```
2. 编写处理“进入编辑模式”的辅助函数：
   ```typescript
   const handleStartEdit = (evt: EventType) => {
     setEditingEventId(evt.id);
     setTitle(evt.title);
     setCategory(evt.category);
     setDescription(evt.description || "");
     setCoverUrl(evt.coverUrl || "");
     setLocation(evt.location);
     // 将时间转换为 input datetime-local 要求的格式: YYYY-MM-DDThh:mm
     const formatDateTime = (dateStr: string) => {
       const d = new Date(dateStr);
       const pad = (n: number) => n.toString().padStart(2, '0');
       return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
     };
     setStartTime(formatDateTime(evt.startTime));
     setEndTime(formatDateTime(evt.endTime));
     setCapacity(evt.capacity.toString());
     setPrice(evt.price.toString());
     setEventMsg("");
     
     // 平滑滚动到表单
     const formEl = document.getElementById("event-form-panel");
     if (formEl) {
       formEl.scrollIntoView({ behavior: "smooth" });
     }
   };
   ```
3. 编写“取消编辑并恢复发布模式”的辅助函数：
   ```typescript
   const handleCancelEdit = () => {
     setEditingEventId(null);
     setTitle("");
     setCategory(categories[0]?.value || "");
     setDescription("");
     setCoverUrl("");
     setLocation("");
     setStartTime("");
     setEndTime("");
     setCapacity("");
     setPrice("");
     setEventMsg("");
   };
   ```

- [ ] **Step 2: 在控制台右侧表单面板外层添加 `id="event-form-panel"`**

修改渲染发布活动面板的 HTML 结构，确保能被滚动定位。

- [ ] **Step 3: 修改表单的标题、提交按钮文案以及增加取消按钮**

1. 将表单标题改为：`{editingEventId ? "编辑活动内容" : "发布全新活动"}`。
2. 将提交按钮文字改为：`{editingEventId ? "保存修改" : "发布活动"}`。
3. 如果 `editingEventId` 不为空，在提交按钮旁边渲染一个 `Button` 按钮用于取消编辑：
   ```tsx
   {editingEventId && (
     <Button
       type="button"
       variant="outline"
       onClick={handleCancelEdit}
       className="h-11 font-semibold"
     >
       取消编辑
     </Button>
   )}
   ```

- [ ] **Step 4: 在活动列表的每一项操作区新增编辑按钮**

在 `app/dashboard/page.tsx` 的活动列表中渲染 `AlertDialog`（删除按钮）的前面，添加“编辑”按钮。
导入 `Pencil` 图标：
```typescript
import { Pencil } from "lucide-react"
```
按钮结构：
```tsx
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => handleStartEdit(evt)}
  className="flex h-8 items-center gap-1 px-3 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
>
  <Pencil className="h-3 w-3" />
  编辑活动
</Button>
```

- [ ] **Step 5: 提交修改**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: 控制台支持编辑模式切换与数据回显"
```

---

### Task 4: 前端保存编辑活动逻辑

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: 修改表单的提交处理函数 `handleCreateEvent` 以支持 PUT 请求**

重构或修改 `handleCreateEvent`：
如果 `editingEventId` 存在，则发送 `PUT` 请求：
```typescript
  // 新的提交处理逻辑
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEventMsg("")

    if (!startTime) {
      setEventMsg("请选择活动开始日期")
      return
    }
    
    // 如果是新建活动，校验开始时间不能早于当前时间
    const start = new Date(startTime)
    if (!editingEventId && start.getTime() - Date.now() < -60 * 1000) {
      setEventMsg("活动开始时间不能早于当前时间")
      return
    }

    const payload = {
      title,
      description,
      coverUrl,
      location,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime || Date.now()).toISOString(),
      capacity: parseInt(capacity),
      price: parseFloat(price || "0"),
      category,
      organizerId: currUser?.id,
    }

    try {
      let res;
      if (editingEventId) {
        res = await fetch(`/api/events?id=${editingEventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (data.success) {
        setEventMsg(editingEventId ? "活动更新成功！" : "活动创建并发布成功！")
        
        // 刷新活动列表
        fetchCreatedEvents()
        
        // 重置/清除编辑状态
        handleCancelEdit()
      } else {
        setEventMsg(data.message || (editingEventId ? "更新失败" : "创建失败"))
      }
    } catch {
      setEventMsg("接口故障")
    }
  }
```
确保将表单的 `<form onSubmit={handleCreateEvent}>` 修改为 `<form onSubmit={handleSubmit}>`。

- [ ] **Step 2: 运行测试并进行手动验证**

1. 运行 `pnpm test`，确保之前的后端测试依然通过。
2. 运行 `pnpm dev`，打开浏览器进入控制台页面，添加一个活动，然后点击“编辑活动”，修改部分字段后点击“保存修改”，检查是否修改成功。

- [ ] **Step 3: 提交修改**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: 完成前端活动编辑保存及模式重置逻辑"
```
