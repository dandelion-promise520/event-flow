import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const organizerId = searchParams.get("organizerId");

    const where: { category?: string; organizerId?: string } = {};
    if (category) where.category = category;
    if (organizerId) where.organizerId = organizerId;

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { name: true } },
        tickets: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 格式化输出数据，计算已售票数
    const formatted = events.map(e => ({
      ...e,
      bookedCount: e.tickets.length,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, coverUrl, location, startTime, endTime, capacity, price, category, organizerId } = body;

    if (!title || !location || !startTime || !endTime || !capacity || !category || !organizerId) {
      return NextResponse.json({ success: false, message: "必填参数缺失" }, { status: 400 });
    }

    const start = new Date(startTime);
    if (start.getTime() - Date.now() < -60 * 1000) {
      return NextResponse.json({ success: false, message: "活动开始时间不能早于当前时间" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        coverUrl,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity: parseInt(capacity),
        price: parseFloat(price || "0"),
        category,
        organizerId,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, coverUrl, location, startTime, endTime, capacity, price, category } = body;

    if (!title || !location || !startTime || !endTime || !capacity || !category) {
      return NextResponse.json({ success: false, message: "必填参数缺失" }, { status: 400 });
    }

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return NextResponse.json({ success: false, message: "活动不存在" }, { status: 404 });
    }

    const newStart = new Date(startTime);
    if (newStart.getTime() !== existingEvent.startTime.getTime()) {
      if (newStart.getTime() - Date.now() < -60 * 1000) {
        return NextResponse.json({ success: false, message: "活动开始时间不能早于当前时间" }, { status: 400 });
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        coverUrl,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity: parseInt(capacity),
        price: parseFloat(price || "0"),
        category,
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "活动删除成功" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
