import { prisma } from "../lib/db.js";
import bcrypt from "bcryptjs";

async function main() {
  // 清理现有数据
  await prisma.ticket.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("admin123", 10);

  // 1. 创建多种角色的测试用户（指定固定主键 ID）
  // 系统管理员
  await prisma.user.create({
    data: {
      id: "u-admin",
      email: "admin@campus.com",
      name: "系统管理员",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  // 组织者们
  const orgComputer = await prisma.user.create({
    data: {
      id: "u-organizer",
      email: "organizer@campus.com",
      name: "计算机协会",
      password: passwordHash,
      role: "ORGANIZER",
    },
  });

  const orgArt = await prisma.user.create({
    data: {
      id: "u-organizer-art",
      email: "art@campus.com",
      name: "大学生艺术团",
      password: passwordHash,
      role: "ORGANIZER",
    },
  });

  const orgSports = await prisma.user.create({
    data: {
      id: "u-organizer-sports",
      email: "sports@campus.com",
      name: "校体育部",
      password: passwordHash,
      role: "ORGANIZER",
    },
  });

  // 普通学生们
  const studentMing = await prisma.user.create({
    data: {
      id: "u-student",
      email: "student@campus.com",
      name: "张小明 (普通学生)",
      password: passwordHash,
      role: "USER",
    },
  });

  const studentLi = await prisma.user.create({
    data: {
      id: "u-student-li",
      email: "lihua@campus.com",
      name: "李华 (外国语学院)",
      password: passwordHash,
      role: "USER",
    },
  });

  const studentWang = await prisma.user.create({
    data: {
      id: "u-student-wang",
      email: "xiaogang@campus.com",
      name: "王小刚 (物理学院)",
      password: passwordHash,
      role: "USER",
    },
  });

  const studentZhao = await prisma.user.create({
    data: {
      id: "u-student-zhao",
      email: "panpan@campus.com",
      name: "赵盼盼 (艺术学院)",
      password: passwordHash,
      role: "USER",
    },
  });

  console.log("种子用户数据创建成功!");

  // 2. 创建丰富多样的活动（指定固定主键 ID）
  // 计算机协会活动
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
      coverUrl: "/images/geek-marathon.jpg",
      organizerId: orgComputer.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      id: "evt-4",
      title: "人工智能前沿与大型语言模型应用",
      description: "特邀业界专家分享大语言模型的最新进展、开源社区生态与校园创新应用实践。",
      location: "图书馆报告厅",
      startTime: new Date("2026-06-16T14:00:00"),
      endTime: new Date("2026-06-16T17:00:00"),
      capacity: 200,
      price: 0,
      category: "学术讲座",
      coverUrl: "/images/ai-forum.jpg",
      organizerId: orgComputer.id,
    },
  });

  const event3 = await prisma.event.create({
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
      coverUrl: "/images/board-games.jpg",
      organizerId: orgComputer.id,
    },
  });

  // 大学生艺术团活动
  const event4 = await prisma.event.create({
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
      coverUrl: "/images/singer-contest.jpg",
      organizerId: orgArt.id,
    },
  });

  const event5 = await prisma.event.create({
    data: {
      id: "evt-6",
      title: "草地音乐节与文创跳蚤市场",
      description: "落日余晖下的现场乐队，琳琅满目的手工作品与闲置好物，一起来感受夏日晚风的浪漫。",
      location: "东区大草坪",
      startTime: new Date("2026-06-28T16:00:00"),
      endTime: new Date("2026-06-28T22:00:00"),
      capacity: 1000,
      price: 0,
      category: "社团活动",
      coverUrl: "/images/music-festival.jpg",
      organizerId: orgArt.id,
    },
  });

  // 校体育部活动
  const event6 = await prisma.event.create({
    data: {
      id: "evt-5",
      title: "“迎新杯”校园羽毛球混合双打赛",
      description: "展现青春活力，促进社团交流，羽毛球双打巅峰对决，等你来战！",
      location: "风雨操场羽毛球馆",
      startTime: new Date("2026-06-22T08:30:00"),
      endTime: new Date("2026-06-22T18:00:00"),
      capacity: 64,
      price: 0,
      category: "文体比赛",
      coverUrl: "/images/badminton.jpg",
      organizerId: orgSports.id,
    },
  });

  const event7 = await prisma.event.create({
    data: {
      id: "evt-8",
      title: "校园星空夜跑挑战赛",
      description: "用脚步丈量夏夜校园，荧光装备免费发放。强身健体，释放压力！",
      location: "学校主体育场",
      startTime: new Date("2026-06-14T19:30:00"),
      endTime: new Date("2026-06-14T21:30:00"),
      capacity: 800,
      price: 0,
      category: "文体比赛",
      coverUrl: "/images/night-run.jpg",
      organizerId: orgSports.id,
    },
  });

  console.log("种子活动数据创建成功!");

  // 3. 订购不同状态的门票，以覆盖多种展示场景
  // 张小明 (studentMing)
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-XM-UNUSED",
      userId: studentMing.id,
      eventId: event1.id,
      status: "UNUSED",
    },
  });
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-XM-USED",
      userId: studentMing.id,
      eventId: event4.id,
      status: "USED",
    },
  });
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-XM-CANCELLED",
      userId: studentMing.id,
      eventId: event3.id,
      status: "CANCELLED",
    },
  });

  // 李华 (studentLi)
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-LH-USED",
      userId: studentLi.id,
      eventId: event1.id,
      status: "USED",
    },
  });
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-LH-UNUSED1",
      userId: studentLi.id,
      eventId: event6.id,
      status: "UNUSED",
    },
  });
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-LH-UNUSED2",
      userId: studentLi.id,
      eventId: event4.id,
      status: "UNUSED",
    },
  });

  // 王小刚 (studentWang)
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-WG-USED1",
      userId: studentWang.id,
      eventId: event2.id,
      status: "USED",
    },
  });
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-WG-UNUSED",
      userId: studentWang.id,
      eventId: event1.id,
      status: "UNUSED",
    },
  });
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-WG-USED2",
      userId: studentWang.id,
      eventId: event7.id,
      status: "USED",
    },
  });

  // 赵盼盼 (studentZhao)
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-PP-UNUSED1",
      userId: studentZhao.id,
      eventId: event4.id,
      status: "UNUSED",
    },
  });
  await prisma.ticket.create({
    data: {
      ticketCode: "TKT-PP-UNUSED2",
      userId: studentZhao.id,
      eventId: event5.id,
      status: "UNUSED",
    },
  });

  console.log("种子门票数据创建成功!");

  // 查找一个已核销的门票
  const usedTicket = await prisma.ticket.findFirst({
    where: { status: "USED" },
    include: { event: true, user: true }
  });

  if (usedTicket) {
    // 写入评价种子数据
    await prisma.review.upsert({
      where: { userId_eventId: { userId: usedTicket.userId, eventId: usedTicket.eventId } },
      update: {},
      create: {
        rating: 5,
        content: "非常好的活动，收获满满！",
        userId: usedTicket.userId,
        eventId: usedTicket.eventId
      }
    });

    // 写入通知种子数据
    await prisma.notification.create({
      data: {
        title: "门票核销成功通知",
        content: `您的《${usedTicket.event.title}》门票已成功核销。欢迎在活动页面撰写您的评价！`,
        userId: usedTicket.userId,
        isRead: false
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
