import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function verifyAdmin(adminId: string | null) {
  if (!adminId) return false;
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  return user?.role === "ADMIN";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("adminId");

    const isAdmin = await verifyAdmin(adminId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "无权访问，仅限管理员" },
        { status: 403 }
      );
    }

    // 1. 全站用户数、活动数、有效门票数、核销数及核销率
    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    
    // 有效门票数定义为 status 不为 CANCELLED
    const totalTickets = await prisma.ticket.count({
      where: {
        status: { not: "CANCELLED" }
      }
    });

    const checkedInTickets = await prisma.ticket.count({
      where: {
        status: "USED"
      }
    });

    const checkInRate = totalTickets > 0 
      ? parseFloat(((checkedInTickets / totalTickets) * 100).toFixed(1)) 
      : 0;

    const stats = {
      totalUsers,
      totalEvents,
      totalTickets,
      checkedInTickets,
      checkInRate
    };

    // 2. 最新注册用户 (前 5 个)
    const latestUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // 3. 最新发布活动 (前 5 个)
    const latestEvents = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        organizer: {
          select: {
            name: true
          }
        }
      }
    });

    // 4. 热门活动 (按有效门票数量排序的前 5 个活动)
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startTime: true,
        endTime: true,
        capacity: true,
        price: true,
        category: true,
        status: true,
        createdAt: true,
        organizer: {
          select: {
            name: true
          }
        },
        tickets: {
          where: {
            status: { not: "CANCELLED" }
          },
          select: {
            id: true
          }
        }
      }
    });

    const popularEvents = events
      .map(event => {
        const { tickets, ...rest } = event;
        return {
          ...rest,
          soldCount: tickets.length
        };
      })
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 5);

    // 5. 活动分类分布
    const categoryCounts = await prisma.event.groupBy({
      by: ["category"],
      _count: {
        _all: true
      }
    });

    const categoryDistribution = categoryCounts.map(item => ({
      category: item.category,
      count: item._count._all
    }));

    return NextResponse.json({
      success: true,
      stats,
      latestUsers,
      latestEvents,
      popularEvents,
      categoryDistribution
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
