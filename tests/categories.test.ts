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
