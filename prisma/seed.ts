import { prisma } from "../lib/db.js";
import bcrypt from "bcryptjs";

async function main() {
  // 清理现有数据
  await prisma.ticket.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("admin123", 10);

  // 1. 创建三种角色的测试用户（指定固定主键 ID）
  await prisma.user.create({
    data: {
      id: "u-admin",
      email: "admin@campus.com",
      name: "系统管理员",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const organizer = await prisma.user.create({
    data: {
      id: "u-organizer",
      email: "organizer@campus.com",
      name: "计算机协会",
      password: passwordHash,
      role: "ORGANIZER",
    },
  });

  const student = await prisma.user.create({
    data: {
      id: "u-student",
      email: "student@campus.com",
      name: "张小明 (普通学生)",
      password: passwordHash,
      role: "USER",
    },
  });

  console.log("种子用户数据创建成功!");

  // 2. 创建不同类别活动（指定固定主键 ID）
  const event1 = await prisma.event.create({
    data: {
      id: "evt-1",
      title: "2026年校园极客马拉松大赛",
      description: "在24小时内用代码解决核心挑战，丰厚大奖等你拿！提供餐饮和睡眠区。",
      location: "计科楼 405 实验室",
      startTime: new Date("2026-06-20T09:00:00"),
      endTime: new Date("2026-06-21T12:00:00"),
      capacity: 100,
      price: 0,
      category: "学术讲座",
      coverUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800",
      organizerId: organizer.id,
    },
  });

  await prisma.event.create({
    data: {
      id: "evt-2",
      title: "校园歌手大赛总决赛",
      description: "十佳歌手同台飙歌，现场观众互动投出人气大奖！",
      location: "大礼堂",
      startTime: new Date("2026-06-25T19:00:00"),
      endTime: new Date("2026-06-25T21:30:00"),
      capacity: 500,
      price: 0,
      category: "文体比赛",
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800",
      organizerId: organizer.id,
    },
  });

  await prisma.event.create({
    data: {
      id: "evt-3",
      title: "夏日社团趣味桌游交流会",
      description: "欢迎所有新生加入，体验阿瓦隆、狼人杀、卡坦岛等多款桌游，结交新朋友！",
      location: "大学生活动中心 201",
      startTime: new Date("2026-06-18T14:00:00"),
      endTime: new Date("2026-06-18T18:00:00"),
      capacity: 30,
      price: 0,
      category: "社团活动",
      coverUrl: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800",
      organizerId: organizer.id,
    },
  });

  console.log("种子活动数据创建成功!");

  // 3. 为学生预订一个门票
  await prisma.ticket.create({
    data: {
      ticketCode: "EVT-20260615-99887",
      userId: student.id,
      eventId: event1.id,
      status: "UNUSED",
    },
  });

  console.log("种子门票预订数据创建成功!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
