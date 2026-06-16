"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  ClipboardList,
  FolderTree,
  Users,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  role: string
  email: string
}

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("campus_user")
    window.location.href = "/"
  }

  if (!user) return null

  const menuItems = [
    // 共有/基础项：主页大盘
    {
      title: "控制台概览",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["USER", "ORGANIZER", "ADMIN"],
    },
    // 主办方专属项
    {
      title: "活动管理",
      href: "/dashboard/events",
      icon: Calendar,
      roles: ["ORGANIZER"],
    },
    {
      title: "现场核销",
      href: "/dashboard/checkin",
      icon: CheckSquare,
      roles: ["ORGANIZER"],
    },
    {
      title: "核销明细",
      href: "/dashboard/tickets",
      icon: ClipboardList,
      roles: ["ORGANIZER"],
    },
    // 管理员专属项
    {
      title: "活动分类管理",
      href: "/dashboard/categories",
      icon: FolderTree,
      roles: ["ADMIN"],
    },
    {
      title: "系统账号管理",
      href: "/dashboard/accounts",
      icon: Users,
      roles: ["ADMIN"],
    },
  ]

  const filteredItems = menuItems.filter((item) => item.roles.includes(user.role))

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between bg-card p-6 text-card-foreground">
      <div>
        <div className="mb-8 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            📅 EventFlow 控制台
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          主菜单
        </div>
        <nav className="space-y-1.5">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand text-brand-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-border/60 pt-4 mt-6">
        <div className="flex items-center gap-3 px-2 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user.role === "USER"
                ? "学生"
                : user.role === "ADMIN"
                  ? "管理员"
                  : "主办方"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* 桌面端侧边栏 */}
      <aside className="hidden lg:block w-64 border-r border-border shrink-0 h-[calc(100vh-4rem)] sticky top-16 bg-card z-30">
        <SidebarContent />
      </aside>

      {/* 移动端汉堡包触发按钮 */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-brand text-brand-foreground hover:bg-brand/90"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* 移动端侧边栏滑动遮罩/抽屉 */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* 遮罩背景 */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          {/* 抽屉面板 */}
          <div className="relative flex w-64 max-w-xs flex-1 flex-col border-r border-border bg-card animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
