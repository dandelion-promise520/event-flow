import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { organizerId, title, content } = await req.json();

    if (!organizerId || !title || !content) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    // 1. 验证活动及发送者身份
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ success: false, message: "未找到该活动" }, { status: 404 });
    }

    const sender = await prisma.user.findUnique({
      where: { id: organizerId },
    });

    if (!sender) {
      return NextResponse.json({ success: false, message: "发送者用户不存在" }, { status: 404 });
    }

    if (event.organizerId !== organizerId && sender.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "无权对非自己创建的活动发布广播" }, { status: 403 });
    }

    // 2. 找出该活动下所有非 CANCELLED 的已购票用户 ID 列表
    const tickets = await prisma.ticket.findMany({
      where: {
        eventId,
        status: { in: ["UNUSED", "USED"] },
      },
      select: {
        userId: true,
      },
    });

    const userIds = Array.from(new Set(tickets.map((t) => t.userId)));

    if (userIds.length > 0) {
      // 3. 批量向所有购票用户插入站内信通知
      const notificationsData = userIds.map((userId) => ({
        title,
        content,
        userId,
      }));

      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    return NextResponse.json({ success: true, count: userIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
