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
