/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: 获取活动分类列表
 *     description: 获取所有活动分类，按名称升序排序
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: 成功获取分类列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: 服务器错误
 *   post:
 *     summary: 创建活动分类
 *     description: 管理员创建新活动分类，包含重名校验
 *     tags:
 *       - Categories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - name
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: 操作管理员的 ID（用于权限校验）
 *               name:
 *                 type: string
 *                 description: 分类名称
 *     responses:
 *       200:
 *         description: 创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 category:
 *                   type: object
 *       400:
 *         description: 分类名称为空或该名称已存在
 *       403:
 *         description: 无权访问，仅限管理员
 *       500:
 *         description: 服务器错误
 *   put:
 *     summary: 修改活动分类
 *     description: 管理员修改指定 ID 的分类名称
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminId
 *               - name
 *             properties:
 *               adminId:
 *                 type: string
 *                 description: 操作管理员的 ID（用于权限校验）
 *               name:
 *                 type: string
 *                 description: 分类名称
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
 *                 category:
 *                   type: object
 *       400:
 *         description: 分类名称为空，参数缺失，或该名称已存在
 *       403:
 *         description: 无权访问，仅限管理员
 *       500:
 *         description: 服务器错误
 *   delete:
 *     summary: 删除活动分类
 *     description: 管理员删除指定 ID 的分类。如果有关联的活动在使用此分类，则拒绝删除
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分类 ID
 *       - in: query
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: 操作管理员的 ID（用于权限校验）
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
 *         description: 分类 ID 缺失，或有活动在使用该分类
 *       403:
 *         description: 无权访问，仅限管理员
 *       404:
 *         description: 分类不存在
 *       500:
 *         description: 服务器错误
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// 辅助函数：校验操作人是否为管理员
async function verifyAdmin(adminId: string | null) {
  if (!adminId) return false;
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  return user?.role === "ADMIN";
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId, name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "分类名称不能为空" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    // 重名检查
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json({ success: false, message: "该分类名称已存在" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, category });
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
    const { adminId, name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: "分类名称不能为空" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    // 重名检查（排除自身）
    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ success: false, message: "该分类名称已存在" }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const adminId = searchParams.get("adminId");

    if (!id) {
      return NextResponse.json({ success: false, message: "分类ID缺失" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ success: false, message: "分类不存在" }, { status: 404 });
    }

    // 安全检查：是否有活动正在关联该分类
    const associatedEventsCount = await prisma.event.count({
      where: { category: category.name },
    });

    if (associatedEventsCount > 0) {
      return NextResponse.json({
        success: false,
        message: `无法删除分类：当前已有 ${associatedEventsCount} 个活动正在使用该分类，请先修改这些活动所属的分类。`
      }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "分类删除成功" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
