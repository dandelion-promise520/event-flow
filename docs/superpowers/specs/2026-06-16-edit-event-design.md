# 活动编辑功能设计文档

本文档详细说明了如何使校园活动管理系统中的活动可以被编辑。

## 1. 背景与目的
目前，活动发布者（主办方）可以创建和删除活动，但无法对已创建的活动进行修改。为了提高活动管理的灵活性，需要提供活动编辑功能，允许主办方修改活动的基本信息（如名称、描述、地点、时间、容量、价格和分类等）。

## 2. 详细设计

### 2.1 前端交互设计 (`app/dashboard/page.tsx`)

*   **新增状态**:
    *   `editingEventId` (`string | null`，默认为 `null`): 记录当前正在编辑的活动 ID。若为 `null` 则表示处于“发布全新活动”模式。
*   **列表页入口**:
    *   在活动管理列表的每一个活动项操作区域（群发消息和删除按钮旁）新增一个“编辑”按钮，使用 Lucide React 的 `Pencil` 图标。
    *   点击“编辑”按钮触发以下逻辑：
        1. 设置 `editingEventId` 为当前活动的 `id`。
        2. 将该活动的原有数据回显到表单状态中（包括 `title`、`description`、`coverUrl`、`location`、`startTime`、`endTime`、`capacity`、`price`、`category`）。
        3. 使用 `window.scrollTo` 平滑滚动到表单所在的 DOM 节点。
*   **表单面板的动态变化**:
    *   **标题**: `editingEventId ? "编辑活动" : "发布全新活动"`
    *   **提交按钮**: `editingEventId ? "保存修改" : "发布活动"`
    *   **取消按钮**: 当处于编辑模式时，在保存按钮旁边显示“取消”按钮。点击后调用重置逻辑，清空表单状态，将 `editingEventId` 置为 `null`，恢复为发布模式。
*   **保存与提交流程**:
    *   表单提交时，判断 `editingEventId`：
        *   若不为 `null`，则调用 `PUT /api/events?id=${editingEventId}` API 接口，并发送修改后的表单数据。
        *   若成功，显示提示“活动更新成功！”，刷新活动列表，清空表单，并重置 `editingEventId` 为 `null`。
        *   若失败，显示错误消息。

### 2.2 后端 API 设计 (`app/api/events/route.ts`)

*   **新增 `PUT` 处理函数**:
    *   **参数**: 通过 URL 获取 `id`（例如 `/api/events?id=xxxx`），与 `DELETE` 方法的传参一致。
    *   **请求体**: 接收 JSON 数据：
        ```json
        {
          "title": "更新后的名称",
          "description": "更新后的描述",
          "coverUrl": "图片链接",
          "location": "更新后的地点",
          "startTime": "2026-06-16T15:00:00.000Z",
          "endTime": "2026-06-16T18:00:00.000Z",
          "capacity": 100,
          "price": 0,
          "category": "学术"
        }
        ```
    *   **校验**:
        *   检查必填字段是否存在。
        *   如果修改了 `startTime`，需校验新设置的时间是否晚于当前时间。若与原本时间一致则跳过此时间校验。
    *   **更新数据库**:
        使用 Prisma 的 `prisma.event.update`：
        ```typescript
        const updatedEvent = await prisma.event.update({
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
          }
        });
        ```
    *   **响应**: 成功时返回 `{ success: true, event: updatedEvent }`。

## 3. 验证方案
1. **测试用例 1: 进入编辑模式**
   - 点击活动列表中的“编辑”按钮，确认表单自动回显正确数据，且表单标题切换为“编辑活动”。
2. **测试用例 2: 取消编辑**
   - 在编辑模式下点击“取消”，确认表单内容被清空，且标题切换回“发布全新活动”。
3. **测试用例 3: 成功保存修改**
   - 修改活动内容并点击“保存修改”，确认页面提示更新成功，列表中的数据实时同步更新，表单重置。
4. **测试用例 4: 校验限制**
   - 尝试将时间改为过去的某个时间，确认接口返回合理的提示并保存失败。
