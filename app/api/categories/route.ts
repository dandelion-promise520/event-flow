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
