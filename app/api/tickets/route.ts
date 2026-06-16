import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const eventId = searchParams.get("eventId");

    const where: { userId?: string; eventId?: string } = {};
    if (userId) where.userId = userId;
    if (eventId) where.eventId = eventId;

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        event: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { bookedAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, eventId } = await req.json();

    if (!userId || !eventId) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    // 并行获取活动详情及判断用户是否已经订阅，消除数据库串行查询瀑布流
    const [event, hasTicket] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: { tickets: true },
      }),
      prisma.ticket.findFirst({
        where: { userId, eventId },
      })
    ]);

    if (!event) {
      return NextResponse.json({ success: false, message: "活动未找到" }, { status: 404 });
    }

    // 检查容量
    if (event.tickets.length >= event.capacity) {
      return NextResponse.json({ success: false, message: "活动名额已满" }, { status: 400 });
    }

    if (hasTicket) {
      return NextResponse.json({ success: false, message: "您已报名该活动" }, { status: 400 });
    }

    // 生成唯一电子核销码 EVT-YYYYMMDD-随机数
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(Math.random() * 90000 + 10000);
    const ticketCode = `EVT-${dateStr}-${rand}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode,
        userId,
        eventId,
      },
    });

    // 写入购票通知
    await prisma.notification.create({
      data: {
        title: "🎫 购票成功通知",
        content: `您已成功报名活动。您的电子核销码为: ${ticketCode}，请凭此码入场。`,
        userId,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
