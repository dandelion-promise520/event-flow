/**
 * @swagger
 * /api/tickets/checkin:
 *   post:
 *     summary: 门票核销
 *     description: 扫描门票核销码进行门票核销，更新状态为 USED 并发送核销成功通知
 *     tags:
 *       - Tickets
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketCode
 *             properties:
 *               ticketCode:
 *                 type: string
 *                 description: 门票核销码
 *     responses:
 *       200:
 *         description: 核销成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 detail:
 *                   type: object
 *                   properties:
 *                     eventTitle:
 *                       type: string
 *                     userName:
 *                       type: string
 *                     checkinTime:
 *                       type: string
 *       400:
 *         description: 门票核销码为空，或门票已被使用/被取消
 *       404:
 *         description: 找不到门票信息
 *       500:
 *         description: 服务器错误
 */
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

    // 写入核销通知
    await prisma.notification.create({
      data: {
        title: "门票核销成功",
        content: `您的《${ticket.event.title}》门票已成功核销。欢迎在活动详情页撰写您的真实评价！`,
        userId: ticket.userId,
      },
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
