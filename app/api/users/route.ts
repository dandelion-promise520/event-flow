import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

async function verifyAdmin(adminId: string | null) {
  if (!adminId) return false;
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  return user?.role === "ADMIN";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }
    if (role !== "all") {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(users);
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { adminId, name, email, role, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ success: false, message: "姓名、邮箱和角色必填" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    // 唯一性校验
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, message: "该邮箱账号已被注册" }, { status: 400 });
    }

    const rawPassword = password || "admin123";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({ success: true, user });
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
    const { adminId, name, email, role, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ success: false, message: "必填字段缺失" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    // 检查被更新用户是否存在
    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      return NextResponse.json({ success: false, message: "用户不存在" }, { status: 404 });
    }

    // 唯一性检查
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ success: false, message: "该邮箱已被其他账号使用" }, { status: 400 });
    }

    const data: Prisma.UserUpdateInput = { name, email, role };
    if (password && password.trim()) {
      data.password = await bcrypt.hash(password.trim(), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    return NextResponse.json({ success: true, user });
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
      return NextResponse.json({ success: false, message: "参数缺失" }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "无权访问，仅限管理员" }, { status: 403 });
    }

    if (id === adminId) {
      return NextResponse.json({ success: false, message: "无法删除当前登录的管理员账号" }, { status: 400 });
    }

    // 检查被删除用户是否存在
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return NextResponse.json({ success: false, message: "用户不存在" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "用户账号删除成功" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
