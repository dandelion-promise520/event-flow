import assert from "node:assert";
import test from "node:test";
import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

test("User Auth flow", async () => {
  // 清理测试数据
  await prisma.user.deleteMany({ where: { email: "test_auth@campus.com" } });

  // 1. 测试注册
  const email = "test_auth@campus.com";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      name: "Test User",
      password: hashedPassword,
      role: "USER"
    }
  });

  assert.strictEqual(user.email, email);
  assert.strictEqual(user.role, "USER");

  // 2. 测试登录密码验证
  const dbUser = await prisma.user.findUnique({ where: { email } });
  assert.ok(dbUser);
  const isMatch = await bcrypt.compare(password, dbUser.password);
  assert.ok(isMatch);

  // 清理测试数据
  await prisma.user.deleteMany({ where: { email: "test_auth@campus.com" } });
});
