import assert from "node:assert";
import test from "node:test";
import { prisma } from "../lib/db";
import { GET, POST, PUT, DELETE } from "../app/api/users/route";
import bcrypt from "bcryptjs";

test("账号管理 API 与数据库操作集成测试", async () => {
  const adminEmail = "temp-admin-test-auth@campus.com";
  const userEmail = "temp-user-test-auth@campus.com";
  const targetEmail = "temp-target-test-auth@campus.com";

  // 清理可能遗留的测试数据
  await prisma.user.deleteMany({
    where: {
      email: { in: [adminEmail, userEmail, targetEmail] }
    }
  });

  // 1. 创建测试所需的管理员和普通用户
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "临时管理员",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  const user = await prisma.user.create({
    data: {
      name: "临时普通用户",
      email: userEmail,
      password: hashedPassword,
      role: "USER"
    }
  });

  // 2. 验证非 ADMIN 用户调用 API 应该被拦截 (403)
  const getReqNonAdmin = new Request(`http://localhost/api/users?adminId=${user.id}`);
  const getResNonAdmin = await GET(getReqNonAdmin);
  assert.strictEqual(getResNonAdmin.status, 403);
  const getNonAdminData = await getResNonAdmin.json();
  assert.strictEqual(getNonAdminData.success, false);
  assert.ok(getNonAdminData.message.includes("无权访问"));

  // 3. 验证管理员创建用户账号 (POST)
  const postReq = new Request("http://localhost/api/users", {
    method: "POST",
    body: JSON.stringify({
      adminId: admin.id,
      name: "临时目标账号",
      email: targetEmail,
      role: "ORGANIZER",
      password: "targetpassword"
    })
  });
  const postRes = await POST(postReq);
  assert.strictEqual(postRes.status, 200);
  const postData = await postRes.json();
  assert.strictEqual(postData.success, true);
  assert.strictEqual(postData.user.name, "临时目标账号");
  assert.strictEqual(postData.user.role, "ORGANIZER");
  const targetUserId = postData.user.id;

  // 4. 验证管理员查询用户列表 (GET - 包含搜索)
  const getReqList = new Request(`http://localhost/api/users?adminId=${admin.id}&search=目标&role=ORGANIZER`);
  const getResList = await GET(getReqList);
  assert.strictEqual(getResList.status, 200);
  const listData = await getResList.json();
  assert.ok(Array.isArray(listData));
  assert.ok(listData.length >= 1);
  assert.strictEqual(listData[0].email, targetEmail);

  // 5. 验证更新用户资料或密码 (PUT)
  const putReq = new Request(`http://localhost/api/users?id=${targetUserId}`, {
    method: "PUT",
    body: JSON.stringify({
      adminId: admin.id,
      name: "更新后的目标账号",
      email: targetEmail,
      role: "USER",
      password: "newpassword"
    })
  });
  const putRes = await PUT(putReq);
  assert.strictEqual(putRes.status, 200);
  const putData = await putRes.json();
  assert.strictEqual(putData.success, true);
  assert.strictEqual(putData.user.name, "更新后的目标账号");
  assert.strictEqual(putData.user.role, "USER");

  // 验证数据库中密码已更新
  const updatedUserDb = await prisma.user.findUnique({ where: { id: targetUserId } });
  assert.ok(updatedUserDb);
  const isMatch = await bcrypt.compare("newpassword", updatedUserDb.password);
  assert.ok(isMatch);

  // 6. 验证拦截管理员自删除 (DELETE)
  const deleteSelfReq = new Request(`http://localhost/api/users?id=${admin.id}&adminId=${admin.id}`, {
    method: "DELETE"
  });
  const deleteSelfRes = await DELETE(deleteSelfReq);
  assert.strictEqual(deleteSelfRes.status, 400);
  const deleteSelfData = await deleteSelfRes.json();
  assert.strictEqual(deleteSelfData.success, false);
  assert.ok(deleteSelfData.message.includes("无法删除当前登录的管理员账号"));

  // 7. 验证删除其他用户 (DELETE)
  const deleteUserReq = new Request(`http://localhost/api/users?id=${targetUserId}&adminId=${admin.id}`, {
    method: "DELETE"
  });
  const deleteUserRes = await DELETE(deleteUserReq);
  assert.strictEqual(deleteUserRes.status, 200);
  const deleteUserData = await deleteUserRes.json();
  assert.strictEqual(deleteUserData.success, true);

  // 验证用户已被删除
  const checkDeleted = await prisma.user.findUnique({ where: { id: targetUserId } });
  assert.strictEqual(checkDeleted, null);

  // 清理测试数据
  await prisma.user.deleteMany({
    where: {
      email: { in: [adminEmail, userEmail, targetEmail] }
    }
  });
});
