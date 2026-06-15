import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 拉取活动评价列表
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const reviews = await prisma.review.findMany({
      where: { eventId },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// 提交活动评价
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { userId, rating, content } = await req.json();

    if (!userId || rating === undefined || !content) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: "评分必须在1到5之间" }, { status: 400 });
    }

    // 强校验：是否购票且门票状态为 USED
    const ticket = await prisma.ticket.findFirst({
      where: { userId, eventId, status: "USED" },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "仅限购票且核销入场的用户才能撰写评价" },
        { status: 403 }
      );
    }

    // 强校验：是否已经评价过
    const existing = await prisma.review.findUnique({
      where: {
        userId_eventId: { userId, eventId },
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, message: "您已为此活动撰写过评价" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        content,
        userId,
        eventId,
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
