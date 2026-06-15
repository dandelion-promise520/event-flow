import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { ticketCode } = await req.json();

    if (!ticketCode) {
      return NextResponse.json({ success: false, message: "门票核销码不能为空" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: { event: true, user: true },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, message: "找不到该门票信息" }, { status: 404 });
    }

    if (ticket.status === "USED") {
      return NextResponse.json({ success: false, message: "该门票已被核销，请勿重复扫描！" }, { status: 400 });
    }

    if (ticket.status === "CANCELLED") {
      return NextResponse.json({ success: false, message: "该门票已被取消/退票！" }, { status: 400 });
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: "USED" },
    });

    return NextResponse.json({
      success: true,
      message: "核销成功",
      detail: {
        eventTitle: ticket.event.title,
        userName: ticket.user.name,
        checkinTime: new Date().toLocaleTimeString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
