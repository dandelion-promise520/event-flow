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
