"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  CheckSquare,
  ClipboardList,
  FolderTree,
  Users,
  LogOut
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface User {
  id: string
  name: string
  role: string
  email: string
}

export default function DashboardSidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      title: "控制台首页",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["USER", "ORGANIZER", "ADMIN"],
    },
    // 主办方专属项
    {
      title: "现场核销",
      href: "/dashboard/checkin",
      icon: CheckSquare,
      roles: ["ORGANIZER", "ADMIN"],
    },
    {
      title: "核销明细",
      href: "/dashboard/tickets",
      icon: ClipboardList,
      roles: ["ORGANIZER", "ADMIN"],
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

  return (
    <Sidebar collapsible="icon" className="top-16 h-[calc(100vh-4rem)] border-r border-border bg-card">
      <SidebarHeader className={`border-b border-border/50 ${isCollapsed ? "p-2" : "p-4"}`}>
        <div className={`flex items-center font-bold text-foreground w-full ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && <span className="truncate text-sm pl-1">EventFlow 控制台</span>}
          <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-2">
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>主菜单</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2 bg-card/50">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="w-full h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              }
            />
            <TooltipContent side="right">
              退出登录 ({user.name})
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2">
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
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
