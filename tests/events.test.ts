import assert from "node:assert";
import test from "node:test";
import { prisma } from "../lib/db";

test("Events CRUD flow", async () => {
  // 清理测试数据
  await prisma.event.deleteMany({ where: { title: "Test Hackathon" } });
  let organizer = await prisma.user.findFirst({ where: { role: "ORGANIZER" } });
  if (!organizer) {
    organizer = await prisma.user.create({
      data: { email: "org@campus.com", name: "Org", password: "123", role: "ORGANIZER" }
    });
  }

  // 1. 创建活动
  const event = await prisma.event.create({
    data: {
      title: "Test Hackathon",
      description: "Code and win!",
      location: "Lab 404",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600 * 1000),
      capacity: 50,
      category: "Academic",
      organizerId: organizer.id
    }
  });

  assert.strictEqual(event.title, "Test Hackathon");
  assert.strictEqual(event.capacity, 50);

  // 2. 查询活动
  const events = await prisma.event.findMany({ where: { category: "Academic" } });
  assert.ok(events.length > 0);

  // 清理测试数据
  await prisma.event.deleteMany({ where: { title: "Test Hackathon" } });
});
