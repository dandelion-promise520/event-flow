/**
 * @swagger
 * /api/notifications/read:
 *   post:
 *     summary: 标记通知为已读
 *     description: 将指定用户的指定通知 ID 列表或全部通知标记为已读
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: 用户 ID
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 要标记已读的通知 ID 列表（如果为空或未提供，则将该用户的所有通知标记为已读）
 *     responses:
 *       200:
 *         description: 操作成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: 用户 ID 不能为空
 *       500:
 *         description: 服务器错误
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId, ids } = await req.json();
    if (!userId) {
      return NextResponse.json({ success: false, message: "用户ID不能为空" }, { status: 400 });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId, id: { in: ids } },
        data: { isRead: true },
      });
    } else {
      // 一键标已读
      await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
