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
