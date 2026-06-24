import assert from "node:assert";
import test from "node:test";
import { prisma } from "../lib/db";
import { GET } from "../app/api/admin/stats/route";

test("管理员数据统计 API 集成测试", async () => {
  const adminEmail = "admin-stats-test-admin@campus.com";
  const userEmail = "admin-stats-test-user@campus.com";
  const organizerEmail = "admin-stats-test-org@campus.com";

  // 1. 清理可能遗留的测试数据 (由于级联删除，删除用户会自动清理相关的活动与门票)
  await prisma.user.deleteMany({
    where: {
      email: { in: [adminEmail, userEmail, organizerEmail] }
    }
  });

  // 2. 创建测试数据
  const admin = await prisma.user.create({
    data: {
      name: "测试管理员",
      email: adminEmail,
      password: "password123",
      role: "ADMIN"
    }
  });

  const user = await prisma.user.create({
    data: {
      name: "测试普通用户",
      email: userEmail,
      password: "password123",
      role: "USER"
    }
  });

  const organizer = await prisma.user.create({
    data: {
      name: "测试主办方",
      email: organizerEmail,
      password: "password123",
      role: "ORGANIZER"
    }
  });

  const event1 = await prisma.event.create({
    data: {
      title: "测试学术讲座",
      description: "测试描述1",
      location: "报告厅",
      startTime: new Date("2026-07-01T09:00:00Z"),
      endTime: new Date("2026-07-01T12:00:00Z"),
      capacity: 10,
      price: 0,
      category: "学术讲座",
      organizerId: organizer.id
    }
  });

  const event2 = await prisma.event.create({
    data: {
      title: "测试文体比赛",
      description: "测试描述2",
      location: "体育馆",
      startTime: new Date("2026-07-02T14:00:00Z"),
      endTime: new Date("2026-07-02T17:00:00Z"),
      capacity: 20,
      price: 10,
      category: "文体比赛",
      organizerId: organizer.id
    }
  });

  // 生成门票
  // 门票1：已核销 (USED)
  await prisma.ticket.create({
    data: {
      ticketCode: "TICKET-111111",
      status: "USED",
      userId: user.id,
      eventId: event1.id
    }
  });

  // 门票2：未核销 (UNUSED)
  await prisma.ticket.create({
    data: {
      ticketCode: "TICKET-222222",
      status: "UNUSED",
      userId: user.id,
      eventId: event1.id
    }
  });

  // 门票3：已取消 (CANCELLED)
  await prisma.ticket.create({
    data: {
      ticketCode: "TICKET-333333",
      status: "CANCELLED",
      userId: user.id,
      eventId: event2.id
    }
  });

  // 3. 验证非管理员请求 (403)
  const reqNonAdmin = new Request(`http://localhost/api/admin/stats?adminId=${user.id}`);
  const resNonAdmin = await GET(reqNonAdmin);
  assert.strictEqual(resNonAdmin.status, 403);
  const nonAdminData = await resNonAdmin.json();
  assert.strictEqual(nonAdminData.success, false);
  assert.ok(nonAdminData.message.includes("无权访问"));

  // 4. 验证管理员请求 (200) 并检查返回的数据结构与数值
  const reqAdmin = new Request(`http://localhost/api/admin/stats?adminId=${admin.id}`);
  const resAdmin = await GET(reqAdmin);
  assert.strictEqual(resAdmin.status, 200);

  const data = await resAdmin.json();

  // 校验包含必要的顶层字段
  assert.ok(data.stats);
  assert.ok(Array.isArray(data.latestUsers));
  assert.ok(Array.isArray(data.latestEvents));
  assert.ok(Array.isArray(data.popularEvents));
  assert.ok(Array.isArray(data.categoryDistribution));

  // 校验 stats 的具体数值
  // 刚才我们创建了 3 个用户，2 个活动。门票有 3 个，其中有效门票为 2 个（USED、UNUSED），核销的为 1 个。
  // 注意，totalUsers / totalEvents 的数值由于数据库中可能原本就存在其他数据，我们需要使用 >= 进行断言
  assert.ok(data.stats.totalUsers >= 3);
  assert.ok(data.stats.totalEvents >= 2);
  assert.ok(data.stats.totalTickets >= 2); // 至少 2 个有效票
  assert.ok(data.stats.checkedInTickets >= 1); // 至少 1 个已核销
  assert.ok(typeof data.stats.checkInRate === "number");

  // 校验最新用户列表中应包含刚刚创建的管理员
  const foundAdmin = data.latestUsers.find((u: any) => u.email === adminEmail);
  assert.ok(foundAdmin);
  assert.strictEqual(foundAdmin.role, "ADMIN");

  // 校验最新活动中包含刚刚创建的活动
  const foundEvent = data.latestEvents.find((e: any) => e.title === "测试学术讲座");
  assert.ok(foundEvent);

  // 校验热门活动中应该存在我们的测试活动，且包含 soldCount（预订量）
  const foundPopularEvent = data.popularEvents.find((e: any) => e.title === "测试学术讲座");
  assert.ok(foundPopularEvent);
  assert.strictEqual(foundPopularEvent.soldCount, 2); // 包含了 2 张有效票

  // 校验分类分布中包含学术讲座和文体比赛
  const categoryLecture = data.categoryDistribution.find((c: any) => c.category === "学术讲座");
  assert.ok(categoryLecture);
  assert.ok(categoryLecture.count >= 1);

  const categorySports = data.categoryDistribution.find((c: any) => c.category === "文体比赛");
  assert.ok(categorySports);
  assert.ok(categorySports.count >= 1);

  // 5. 清理测试数据
  await prisma.user.deleteMany({
    where: {
      email: { in: [adminEmail, userEmail, organizerEmail] }
    }
  });
});
