import assert from "node:assert";
import test from "node:test";
import { prisma } from "../lib/db";

test("数据库新增模型查询验证", async () => {
  const reviews = await prisma.review.findMany();
  assert.ok(reviews.length >= 1, "应该至少有一条评价种子数据");

  const notifications = await prisma.notification.findMany();
  assert.ok(notifications.length >= 1, "应该至少有一条通知种子数据");
});
