/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: 获取活动列表
 *     description: 根据分类或组织者 ID 筛选活动，按创建时间降序排序
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 按活动分类名过滤
 *       - in: query
 *         name: organizerId
 *         schema:
 *           type: string
 *         description: 按组织者（用户）ID 过滤
 *     responses:
 *       200:
 *         description: 成功获取活动列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   coverUrl:
 *                     type: string
 *                   location:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                     format: date-time
 *                   endTime:
 *                     type: string
 *                     format: date-time
 *                   capacity:
 *                     type: integer
 *                   price:
 *                     type: number
 *                   category:
 *                     type: string
 *                   organizerId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   bookedCount:
 *                     type: integer
 *                     description: 已报名的门票数量
 *                   organizer:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *       500:
 *         description: 服务器错误
 *   post:
 *     summary: 创建活动
 *     description: 创建一个新活动，开始时间不能早于当前时间
 *     tags:
 *       - Events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - startTime
 *               - endTime
 *               - capacity
 *               - category
 *               - organizerId
 *             properties:
 *               title:
 *                 type: string
 *                 description: 活动标题
 *               description:
 *                 type: string
 *                 description: 活动描述
 *               coverUrl:
 *                 type: string
 *                 description: 封面图片 URL
 *               location:
 *                 type: string
 *                 description: 活动地点
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: 开始时间
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: 结束时间
 *               capacity:
 *                 type: integer
 *                 description: 容纳人数上限
 *               price:
 *                 type: number
 *                 description: 票价（可选，默认 0）
 *               category:
 *                 type: string
 *                 description: 分类名称
 *               organizerId:
 *                 type: string
 *                 description: 组织者 ID
 *     responses:
 *       200:
 *         description: 活动创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 event:
 *                   type: object
 *       400:
 *         description: 参数缺失或开始时间早于当前时间
 *       500:
 *         description: 服务器错误
 *   put:
 *     summary: 修改活动
 *     description: 修改指定 ID 的活动信息，如果是修改开始时间，则新时间不能早于当前时间
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 活动 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - location
 *               - startTime
 *               - endTime
 *               - capacity
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               coverUrl:
 *                 type: string
 *               location:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               capacity:
 *                 type: integer
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: 修改成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 event:
 *                   type: object
 *       400:
 *         description: 参数缺失或开始时间早于当前时间
 *       404:
 *         description: 活动不存在
 *       500:
 *         description: 服务器错误
 *   delete:
 *     summary: 删除活动
 *     description: 根据指定 ID 删除活动
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 活动 ID
 *     responses:
 *       200:
 *         description: 删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 参数缺失
 *       500:
 *         description: 服务器错误
 */
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
