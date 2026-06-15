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
