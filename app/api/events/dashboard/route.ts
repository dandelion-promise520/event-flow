import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const organizerId = searchParams.get("organizerId");

    if (!organizerId) {
      return NextResponse.json({ success: false, message: "组织者ID不能为空" }, { status: 400 });
    }

    // 验证组织者身份
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
    });

    if (!organizer || (organizer.role !== "ORGANIZER" && organizer.role !== "ADMIN")) {
      return NextResponse.json({ success: false, message: "无权访问此数据" }, { status: 403 });
    }

    // 1. 获取活动列表，如果是 ADMIN 则获取全部，否则获取该组织者名下的活动
    const events = await prisma.event.findMany({
      where: organizer.role === "ADMIN" ? {} : { organizerId },
      include: {
        tickets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedEvents = events.map((e) => ({
      id: e.id,
      title: e.title,
      capacity: e.capacity,
      price: e.price,
      location: e.location,
      category: e.category,
      startTime: e.startTime.toISOString(),
      soldCount: e.tickets.length,
      checkedInCount: e.tickets.filter((t) => t.status === "USED").length,
    }));

    // 2. 获取已售出的门票明细数据，如果是 ADMIN 则获取全部，否则获取针对该组织者活动的门票
    const tickets = await prisma.ticket.findMany({
      where: organizer.role === "ADMIN" ? {} : {
        event: {
          organizerId,
        },
      },
      include: {
        event: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { bookedAt: "desc" },
    });

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      ticketCode: t.ticketCode,
      eventTitle: t.event.title,
      userName: t.user.name,
      userEmail: t.user.email,
      status: t.status,
      bookedAt: t.bookedAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({
      events: formattedEvents,
      tickets: formattedTickets,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
