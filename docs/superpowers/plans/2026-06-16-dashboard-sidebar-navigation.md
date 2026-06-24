# 侧边栏导航与控制台子页面重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将复杂的个人控制台（Dashboard）页面拆分为多路由架构（主页、活动管理、现场核销、门票明细），并在左侧提供支持自适应的优雅侧边栏导航，以提升用户体验并降低代码耦合度。

**Architecture:** 新建 `components/dashboard-sidebar.tsx` 公共导航侧边栏，并在 `app/dashboard/layout.tsx` 中将其作为所有子路由的通用包裹结构。将原本在单个 page.tsx 中的不同角色业务（学生门票大盘、主办方数据分析、活动发布编辑、门票扫码核销、核销明细过滤及 CSV 导出）完全提取到对应的子页面路由中，实现职责分离和模块化开发。

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, Lucide Icons, shadcn/ui components

---

### Task 1: 创建自适应侧边栏导航组件

**Files:**
- Create: `components/dashboard-sidebar.tsx`

- [ ] **Step 1: 编写 sidebar 侧边栏组件代码**

  编写 `components/dashboard-sidebar.tsx`，支持根据用户角色 (`USER`, `ORGANIZER`, `ADMIN`) 动态展示不同的导航链接，并支持移动端下的折叠/滑动抽屉交互。

  ```tsx
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
  ```

- [ ] **Step 2: 验证组件 TypeScript 编译无误**

  在终端运行 tsc 或 build 检查类型：
  Run: `npx tsc --noEmit`
  Expected: 无类型错误。

- [ ] **Step 3: 提交修改**

  ```bash
  git add components/dashboard-sidebar.tsx
  git commit -m "feat: 增加自适应 Dashboard 侧边栏导航组件"
  ```

---

### Task 2: 创建控制台通用 Layout 布局

**Files:**
- Create: `app/dashboard/layout.tsx`

- [ ] **Step 1: 编写 Layout 组件代码**

  编写 `app/dashboard/layout.tsx`，包装侧边栏组件和子页面区域，实现统一的页面网格结构。

  ```tsx
  "use client"

  import { useEffect, useState } from "react"
  import { useRouter } from "next/navigation"
  import { Loader2 } from "lucide-react"
  import DashboardSidebar from "@/components/dashboard-sidebar"

  export default function DashboardLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
      const stored = localStorage.getItem("campus_user")
      if (!stored) {
        router.push("/login")
      } else {
        setLoading(false)
      }
    }, [router])

    if (loading) {
      return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    return (
      <div className="flex min-h-[calc(100vh-4rem)] bg-background">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    )
  }
  ```

- [ ] **Step 2: 运行编译测试**

  Run: `npx tsc --noEmit`
  Expected: 无类型错误。

- [ ] **Step 3: 提交修改**

  ```bash
  git add app/dashboard/layout.tsx
  git commit -m "feat: 增加通用 Dashboard layout 侧边栏布局容器"
  ```

---

### Task 3: 重构控制台首页（/dashboard）

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: 重构 `app/dashboard/page.tsx`**

  仅保留控制台首页的数据概览与学生门票大盘。将原本发布活动、核销、明细逻辑在此页面中清除。
  注：为保持现有 API 不受破坏，我们仍使用原有的 loadDashboardData 从服务器获取大盘状态。

  ```tsx
  "use client"

  import { useEffect, useState } from "react"
  import Link from "next/link"
  import { Loader2 } from "lucide-react"
  import { Badge } from "@/components/ui/badge"
  import DashboardAnalytics from "@/components/dashboard-analytics"
  import type { EventData } from "@/lib/analytics-utils"

  interface User {
    id: string
    name: string
    role: string
    email: string
  }

  interface EventType {
    id: string
    title: string
    category: string
    location: string
    startTime: string
    capacity: number
    soldCount?: number
    bookedCount?: number
  }

  interface TicketType {
    id: string
    status: string
    ticketCode: string
    event: EventType
  }

  export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [tickets, setTickets] = useState<TicketType[]>([])
    const [createdEvents, setCreatedEvents] = useState<EventType[]>([])
    const [dashboardTickets, setDashboardTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadDashboardData = async (currUser: User) => {
      try {
        if (currUser.role === "USER") {
          const res = await fetch(`/api/tickets?userId=${currUser.id}`)
          const data = await res.json()
          setTickets(data)
        } else {
          const res = await fetch(`/api/events/dashboard?organizerId=${currUser.id}`)
          const data = await res.json()
          if (data.events) {
            const formatted = data.events.map((e: EventType) => ({
              ...e,
              bookedCount: e.soldCount,
            }))
            setCreatedEvents(formatted)
          }
          if (data.tickets) {
            setDashboardTickets(data.tickets)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      const stored = localStorage.getItem("campus_user")
      if (stored) {
        const curr = JSON.parse(stored)
        setUser(curr)
        loadDashboardData(curr)
      }
    }, [])

    if (loading || !user) {
      return (
        <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">控制台概览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            欢迎回来，{user.name} ({user.role === "USER" ? "学生" : user.role === "ADMIN" ? "系统管理员" : "主办方"})
          </p>
        </div>

        {user.role === "USER" && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-foreground">我的活动门票</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">{t.event.category}</Badge>
                      <span
                        className={`text-xs font-semibold ${
                          t.status === "UNUSED"
                            ? "text-foreground"
                            : "text-muted-foreground/80"
                        }`}
                      >
                        {t.status === "UNUSED" ? "● 待核销" : "● 已使用"}
                      </span>
                    </div>
                    <h3 className="mt-3 line-clamp-1 font-bold text-foreground">
                      {t.event.title}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground">
                      地点: {t.event.location}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      时间: {new Date(t.event.startTime).toLocaleString("zh-CN")}
                    </p>
                  </div>

                  <div className="-mx-6 mt-6 -mb-6 flex flex-col gap-2 rounded-b-2xl border-t border-dashed border-border bg-muted p-6 pt-4">
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground/80">
                      电子入场密钥 (核销码)
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground/90 select-all">
                      {t.ticketCode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {tickets.length === 0 && (
              <p className="mt-8 text-center text-sm text-muted-foreground/80">
                目前还没有订购任何活动门票
              </p>
            )}
          </div>
        )}

        {user.role === "ORGANIZER" && (
          <div className="space-y-6">
            <DashboardAnalytics
              events={createdEvents as unknown as EventData[]}
              tickets={dashboardTickets}
            />
          </div>
        )}

        {user.role === "ADMIN" && (
          <div className="grid gap-6 sm:grid-cols-2 mt-4">
            <Link
              href="/dashboard/categories"
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:bg-muted/50 transition-colors"
            >
              <div>
                <h3 className="font-bold text-foreground">活动分类管理</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  对校园活动类型进行创建、重命名或删除维护
                </p>
              </div>
              <span className="text-xl">📂</span>
            </Link>
            <Link
              href="/dashboard/accounts"
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-xs hover:bg-muted/50 transition-colors"
            >
              <div>
                <h3 className="font-bold text-foreground">系统账号管理</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  新建、修改、重置密码及移除系统账号
                </p>
              </div>
              <span className="text-xl">👥</span>
            </Link>
          </div>
        )}
      </div>
    )
  }
  ```

- [ ] **Step 2: 编译测试**

  Run: `npx tsc --noEmit`
  Expected: 无类型错误。

- [ ] **Step 3: 提交修改**

  ```bash
  git add app/dashboard/page.tsx
  git commit -m "refactor: 精简 /dashboard 首页，移除多余的主办方功能板块"
  ```

---

### Task 4: 创建主办方活动管理子页面（/dashboard/events）

**Files:**
- Create: `app/dashboard/events/page.tsx`

- [ ] **Step 1: 移植发布、编辑活动及广播功能**

  编写 `app/dashboard/events/page.tsx`，将原本位于主 dashboard 页面上的发布活动表单、编辑活动逻辑、活动列表展示以及群发消息模态框整体搬迁至该页面。

  ```tsx
  "use client"

  import { useEffect, useState } from "react"
  import {
    Loader2,
    Plus,
    Trash2,
    Megaphone,
    Pencil,
    X,
    Calendar as CalendarIcon
  } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { FileUploader, type UploadFile } from "@/components/ui/file-uploader"
  import { toast } from "sonner"
  import { Input } from "@/components/ui/input"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import { Textarea } from "@/components/ui/textarea"
  import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
  import { Calendar } from "@/components/ui/calendar"
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
  import { format } from "date-fns"
  import { zhCN } from "date-fns/locale"
  import { cn } from "@/lib/utils"

  interface User {
    id: string
    name: string
    role: string
    email: string
  }

  interface EventType {
    id: string
    title: string
    category: string
    location: string
    startTime: string
    capacity: number
    bookedCount?: number
    soldCount?: number
    description?: string
    coverUrl?: string | null
  }

  export default function EventsManagementPage() {
    const [user, setUser] = useState<User | null>(null)
    const [createdEvents, setCreatedEvents] = useState<EventType[]>([])
    const [loading, setLoading] = useState(true)
    const [dbCategories, setDbCategories] = useState<{ label: string; value: string }[]>([])

    // 发布/编辑活动表单状态
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [location, setLocation] = useState("")
    const [capacity, setCapacity] = useState("50")
    const [category, setCategory] = useState("学术讲座")
    const [eventMsg, setEventMsg] = useState("")
    const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([])
    const [editingEventId, setEditingEventId] = useState<string | null>(null)
    const [originalStartTime, setOriginalStartTime] = useState<string | null>(null)

    // 日期选择状态
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedHour, setSelectedHour] = useState("09")
    const [selectedMinute, setSelectedMinute] = useState("00")

    // 广播通知表单状态
    const [broadcastEventId, setBroadcastEventId] = useState<string | null>(null)
    const [broadcastTitle, setBroadcastTitle] = useState("")
    const [broadcastContent, setBroadcastContent] = useState("")
    const [broadcastMsg, setBroadcastMsg] = useState("")
    const [broadcastLoading, setBroadcastLoading] = useState(false)

    const startTimeStr = selectedDate
      ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}T${selectedHour}:${selectedMinute}`
      : ""

    const loadEventsData = async (currUser: User) => {
      try {
        const res = await fetch(`/api/events/dashboard?organizerId=${currUser.id}`)
        const data = await res.json()
        if (data.events) {
          const formatted = data.events.map((e: EventType) => ({
            ...e,
            bookedCount: e.soldCount,
          }))
          setCreatedEvents(formatted)
        }
      } catch (err) {
        console.error(err)
        toast.error("获取活动数据失败")
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      const stored = localStorage.getItem("campus_user")
      if (stored) {
        const curr = JSON.parse(stored)
        setUser(curr)
        loadEventsData(curr)
      }

      const fetchCategories = async () => {
        try {
          const res = await fetch("/api/categories")
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) {
              setDbCategories(data.map((c: any) => ({ label: c.name, value: c.name })))
            }
          }
        } catch (err) {
          console.error("加载动态分类失败:", err)
        }
      }
      fetchCategories()
    }, [])

    const handleImageUpload = async (
      file: UploadFile,
      onProgress: (progress: number) => void
    ) => {
      const formData = new FormData()
      if (file.rawFile) {
        formData.append("file", file.rawFile)
      }

      return new Promise<{ url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/upload")

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress(progress)
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              if (data.success) {
                resolve({ url: data.url })
              } else {
                reject(new Error(data.message || "上传失败"))
              }
            } catch {
              reject(new Error("解析响应失败"))
            }
          } else {
            reject(new Error(`服务器响应错误: ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error("网络错误，上传失败"))
        xhr.send(formData)
      })
    }

    const validateTime = (date: Date | undefined, hour: string, minute: string) => {
      if (!date) {
        setEventMsg((prev) =>
          prev === "活动开始时间不能早于当前时间" || prev === "请选择活动开始日期"
            ? ""
            : prev
        )
        return
      }
      const tempStartTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${hour}:${minute}`

      if (editingEventId && tempStartTime === originalStartTime) {
        setEventMsg((prev) => (prev === "活动开始时间不能早于当前时间" ? "" : prev))
        return
      }

      const selectedDateTime = new Date(tempStartTime)
      if (selectedDateTime.getTime() - Date.now() < -60 * 1000) {
        setEventMsg("活动开始时间不能早于当前时间")
      } else {
        setEventMsg((prev) =>
          prev === "活动开始时间不能早于当前时间" || prev === "请选择活动开始日期"
            ? ""
            : prev
        )
      }
    }

    const handleDateSelect = (date: Date | undefined) => {
      setSelectedDate(date)
      validateTime(date, selectedHour, selectedMinute)
    }

    const handleHourChange = (hour: string | null) => {
      const h = hour || "00"
      setSelectedHour(h)
      validateTime(selectedDate, h, selectedMinute)
    }

    const handleMinuteChange = (minute: string | null) => {
      const m = minute || "00"
      setSelectedMinute(m)
      validateTime(selectedDate, selectedHour, m)
    }

    const handleStartEdit = (evt: EventType) => {
      setEditingEventId(evt.id)
      setOriginalStartTime(evt.startTime)
      setTitle(evt.title)
      setCategory(evt.category)
      setDescription(evt.description || "")
      setLocation(evt.location)
      setCapacity(evt.capacity.toString())

      const start = new Date(evt.startTime)
      setSelectedDate(start)
      setSelectedHour(String(start.getHours()).padStart(2, "0"))
      setSelectedMinute(String(start.getMinutes()).padStart(2, "0"))

      setUploadedFiles(
        evt.coverUrl
          ? [
              {
                id: "existing-cover",
                name: "current-cover.png",
                size: 0,
                type: "image/png",
                status: "success",
                url: evt.coverUrl,
              },
            ]
          : []
      )
      setEventMsg("")

      const formPanel = document.getElementById("event-form-panel")
      if (formPanel) {
        formPanel.scrollIntoView({ behavior: "smooth" })
      }
    }

    const handleCancelEdit = () => {
      setEditingEventId(null)
      setOriginalStartTime(null)
      setTitle("")
      setCategory(dbCategories[0]?.value || "学术讲座")
      setDescription("")
      setLocation("")
      setCapacity("50")
      setSelectedDate(undefined)
      setSelectedHour("09")
      setSelectedMinute("00")
      setUploadedFiles([])
      setEventMsg("")
    }

    const handleCreateOrUpdateEvent = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!user) return
      setEventMsg("")

      if (!selectedDate) {
        setEventMsg("请选择活动开始日期")
        return
      }

      const coverUrl = uploadedFiles.find((f) => f.status === "success")?.url || null

      try {
        let res
        if (editingEventId) {
          if (startTimeStr !== originalStartTime) {
            const selectedDateTime = new Date(startTimeStr)
            if (selectedDateTime.getTime() - Date.now() < -60 * 1000) {
              setEventMsg("活动开始时间不能早于当前时间")
              return
            }
          }

          res = await fetch(`/api/events?id=${editingEventId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description,
              coverUrl,
              location,
              startTime: startTimeStr,
              endTime: startTimeStr,
              capacity: parseInt(capacity),
              category,
            }),
          })
        } else {
          const selectedDateTime = new Date(startTimeStr)
          if (selectedDateTime.getTime() - Date.now() < -60 * 1000) {
            setEventMsg("活动开始时间不能早于当前时间")
            return
          }

          res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description,
              coverUrl,
              location,
              startTime: startTimeStr,
              endTime: startTimeStr,
              capacity: parseInt(capacity),
              category,
              organizerId: user.id,
            }),
          })
        }

        const data = await res.json()
        if (data.success) {
          toast.success(editingEventId ? "活动更新成功！" : "活动创建并发布成功！")
          handleCancelEdit()
          loadEventsData(user)
        } else {
          setEventMsg(data.message || (editingEventId ? "更新失败" : "创建失败"))
          toast.error(data.message || (editingEventId ? "更新失败" : "创建失败"))
        }
      } catch {
        setEventMsg("接口故障")
        toast.error("网络故障，操作失败")
      }
    }

    const handleDeleteEvent = async (id: string) => {
      if (!user) return
      try {
        const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" })
        const data = await res.json()
        if (data.success) {
          toast.success("活动已成功删除")
          loadEventsData(user)
        } else {
          toast.error(data.message || "删除活动失败")
        }
      } catch {
        toast.error("网络异常，删除活动失败")
      }
    }

    const handleSendBroadcast = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!broadcastEventId || !user) return
      setBroadcastLoading(true)
      setBroadcastMsg("")
      try {
        const res = await fetch(`/api/events/${broadcastEventId}/broadcast`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizerId: user.id,
            title: broadcastTitle,
            content: broadcastContent,
          }),
        })
        const data = await res.json()
        if (data.success) {
          toast.success("广播消息已成功群发给所有购票者！")
          setBroadcastContent("")
          setBroadcastEventId(null)
          setBroadcastTitle("")
          setBroadcastMsg("")
        } else {
          setBroadcastMsg(data.message || "群发广播失败")
          toast.error(data.message || "群发广播失败")
        }
      } catch {
        setBroadcastMsg("广播接口故障")
        toast.error("网络故障，广播发送失败")
      } finally {
        setBroadcastLoading(false)
      }
    }

    if (loading || !user) {
      return (
        <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">活动发布与管理</h1>
          <p className="text-sm text-muted-foreground mt-1">创建校园活动、编辑活动属性以及向参与人发送广播消息</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* 左侧：发布与编辑表单 */}
          <div id="event-form-panel" className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-xs h-fit">
            <h2 className="text-base font-bold text-foreground mb-4">
              {editingEventId ? "📝 编辑活动信息" : "📣 发布全新校园活动"}
            </h2>
            <form onSubmit={handleCreateOrUpdateEvent} className="space-y-4">
              <FieldGroup className="space-y-3">
                <Field>
                  <FieldLabel>活动名称</FieldLabel>
                  <Input
                    type="text"
                    placeholder="输入活动主题..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>活动类别</FieldLabel>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-background text-foreground">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border border-border bg-popover shadow-md">
                        <SelectGroup>
                          {(dbCategories.length > 0 ? dbCategories : [
                            { label: "学术讲座", value: "学术讲座" },
                            { label: "文体比赛", value: "文体比赛" },
                            { label: "社团活动", value: "社团活动" },
                          ]).map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>人数上限容量</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g. 100"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      required
                      className="bg-background text-foreground"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>举办地点</FieldLabel>
                  <Input
                    type="text"
                    placeholder="e.g. 大礼堂 / 线上腾讯会议..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="bg-background text-foreground"
                  />
                </Field>

                <Field>
                  <FieldLabel>开始时间 (24小时制)</FieldLabel>
                  <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                      <PopoverTrigger
                        className={cn(
                          "flex h-9 cursor-pointer items-center justify-start gap-1.5 rounded-lg border border-border bg-background py-2 pr-2.5 pl-3 text-left text-xs text-muted-foreground outline-hidden transition-colors select-none hover:bg-muted",
                          !selectedDate && "text-muted-foreground/80"
                        )}
                      >
                        <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/85" />
                        {selectedDate ? (
                          format(selectedDate, "yyyy-MM-dd")
                        ) : (
                          "选择活动日期"
                        )}
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto rounded-lg border border-border bg-popover p-0 shadow-md"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          locale={zhCN}
                          className="bg-popover text-foreground"
                        />
                      </PopoverContent>
                    </Popover>

                    <Select value={selectedHour} onValueChange={handleHourChange}>
                      <SelectTrigger className="h-9 w-16 bg-background text-xs text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 rounded-lg border border-border bg-popover shadow-md">
                        {Array.from({ length: 24 }).map((_, i) => {
                          const h = String(i).padStart(2, "0")
                          return (
                            <SelectItem key={h} value={h}>
                              {h} 时
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>

                    <Select value={selectedMinute} onValueChange={handleMinuteChange}>
                      <SelectTrigger className="h-9 w-16 bg-background text-xs text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 rounded-lg border border-border bg-popover shadow-md">
                        {Array.from({ length: 60 }).map((_, i) => {
                          const m = String(i).padStart(2, "0")
                          return (
                            <SelectItem key={m} value={m}>
                              {m} 分
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </Field>

                <Field>
                  <FieldLabel>活动宣传海报 (可选)</FieldLabel>
                  <FileUploader
                    value={uploadedFiles}
                    onValueChange={setUploadedFiles}
                    onUpload={handleImageUpload}
                    maxFiles={1}
                    maxSize={2 * 1024 * 1024}
                    accept="image/*"
                    className="border-dashed"
                  />
                </Field>

                <Field>
                  <FieldLabel>活动详细描述</FieldLabel>
                  <Textarea
                    placeholder="输入活动详情、流程安排、注意事项等..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="bg-background text-foreground"
                  />
                </Field>

                {eventMsg && (
                  <p className="text-xs font-semibold text-destructive">
                    ⚠️ {eventMsg}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="h-10 flex-1 cursor-pointer font-bold bg-brand text-brand-foreground hover:bg-brand/90"
                    disabled={!selectedDate || eventMsg === "活动开始时间不能早于当前时间"}
                  >
                    {!editingEventId && <Plus data-icon="inline-start" />}
                    {editingEventId ? "保存修改" : "确认发布活动"}
                  </Button>
                  {editingEventId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="h-10 cursor-pointer font-semibold"
                    >
                      取消编辑
                    </Button>
                  )}
                </div>
              </FieldGroup>
            </form>
          </div>

          {/* 右侧：活动管理列表 */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col min-h-125">
            <h2 className="text-base font-bold text-foreground mb-4">📅 活动管理列表</h2>
            <div className="divide-y divide-border flex-1">
              {createdEvents.map((evt) => (
                <div key={evt.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <h3 className="text-sm font-bold text-foreground/90">{evt.title}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      地点: {evt.location} | 容量: {evt.capacity} 人 | 已售: {evt.bookedCount} 张
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(evt)}
                      className="flex h-8 items-center gap-1 px-3 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                      编辑活动
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBroadcastEventId(evt.id)
                        setBroadcastTitle(`关于活动《${evt.title}》的通知`)
                        setBroadcastContent("")
                        setBroadcastMsg("")
                      }}
                      className="flex h-8 items-center gap-1 px-3 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Megaphone className="h-3 w-3" />
                      群发消息
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground/80 hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除此活动吗?</AlertDialogTitle>
                          <AlertDialogDescription>此操作无法撤销，所有已订票将同步失效。</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEvent(evt.id)}>
                            确认
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {createdEvents.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground/80">
                  目前未发布任何活动
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 广播弹窗 */}
        <AlertDialog
          open={!!broadcastEventId}
          onOpenChange={(open) => {
            if (!open) {
              setBroadcastEventId(null)
              setBroadcastTitle("")
              setBroadcastContent("")
              setBroadcastMsg("")
            }
          }}
        >
          <AlertDialogContent className="sm:max-w-md">
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <AlertDialogHeader>
                <AlertDialogTitle>群发广播通知</AlertDialogTitle>
                <AlertDialogDescription>向所有订购该活动门票的用户发送站内信通知。</AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-foreground/80">通知标题</label>
                  <Input
                    type="text"
                    placeholder="请输入通知标题，如：活动场地变更"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                    className="mt-1 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground/80">通知内容</label>
                  <Textarea
                    placeholder="请输入通知的详细内容..."
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    required
                    rows={4}
                    className="mt-1 bg-background text-foreground"
                  />
                </div>
                {broadcastMsg && (
                  <p className={cn("text-xs font-semibold", broadcastMsg.includes("成功") ? "text-emerald-600" : "text-destructive")}>
                    {broadcastMsg}
                  </p>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel
                  type="button"
                  onClick={() => {
                    setBroadcastEventId(null)
                    setBroadcastTitle("")
                    setBroadcastContent("")
                    setBroadcastMsg("")
                  }}
                  disabled={broadcastLoading}
                >
                  取消
                </AlertDialogCancel>
                <Button type="submit" disabled={broadcastLoading} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  {broadcastLoading ? "发送中..." : "确定发送"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }
  ```

- [ ] **Step 2: 编译测试**

  Run: `npx tsc --noEmit`
  Expected: 无类型错误。

- [ ] **Step 3: 提交修改**

  ```bash
  git add app/dashboard/events/page.tsx
  git commit -m "feat: 增加主办方活动管理子页面 (/dashboard/events)"
  ```

---

### Task 5: 创建现场扫码核销子页面（/dashboard/checkin）

**Files:**
- Create: `app/dashboard/checkin/page.tsx`

- [ ] **Step 1: 编写一键核销页面逻辑**

  编写 `app/dashboard/checkin/page.tsx`。

  ```tsx
  "use client"

  import { useEffect, useState } from "react"
  import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"

  interface User {
    id: string
    name: string
    role: string
    email: string
  }

  export default function CheckinPage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [ticketCodeInput, setTicketCodeInput] = useState("")
    const [checkinMsg, setCheckinMsg] = useState<{
      text: string
      type: "success" | "error"
      detail?: {
        eventTitle: string
        userName: string
        checkinTime: string
      }
    } | null>(null)

    useEffect(() => {
      const stored = localStorage.getItem("campus_user")
      if (stored) {
        setUser(JSON.parse(stored))
      }
      setLoading(false)
    }, [])

    const handleCheckin = async (e: React.FormEvent) => {
      e.preventDefault()
      setCheckinMsg(null)
      const code = ticketCodeInput.trim()
      if (!code) {
        setCheckinMsg({
          text: "请先输入门票代码",
          type: "error",
        })
        return
      }
      try {
        const res = await fetch("/api/tickets/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketCode: code }),
        })
        const data = await res.json()
        if (data.success) {
          setCheckinMsg({
            text: "核销成功",
            type: "success",
            detail: data.detail,
          })
          setTicketCodeInput("")
        } else {
          setCheckinMsg({
            text: data.message || "核销失败",
            type: "error",
          })
        }
      } catch {
        setCheckinMsg({
          text: "核销接口故障",
          type: "error",
        })
      }
    }

    if (loading || !user) {
      return (
        <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">电子门票核销</h1>
          <p className="text-sm text-muted-foreground mt-1">在活动现场扫描或输入电子门票密钥进行核销</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-4">电子门票现场核销</h2>
          <form onSubmit={handleCheckin} className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="输入门票代码 (e.g. EVT-...)"
              value={ticketCodeInput}
              onChange={(e) => setTicketCodeInput(e.target.value)}
              className="h-10 flex-1 bg-background text-foreground"
            />
            <Button type="submit" className="h-10 px-4 text-xs font-semibold">
              一键核销
            </Button>
          </form>

          {checkinMsg && (
            checkinMsg.type === "success" ? (
              <div className="mt-3 animate-in rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-emerald-800 duration-200 fade-in slide-in-from-top-1 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-emerald-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-semibold select-none">核销成功</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5 rounded text-emerald-600/70 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-400/70 dark:hover:bg-emerald-950/40"
                    onClick={() => setCheckinMsg(null)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
                {checkinMsg.detail && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-emerald-100/50 pt-3 text-xs dark:border-emerald-950/20">
                    <div className="flex items-center gap-2">
                      <span className="min-w-16 text-emerald-600/80 dark:text-emerald-400/80">入场人员:</span>
                      <span className="rounded bg-emerald-100/50 px-2 py-0.5 font-semibold text-emerald-900 dark:bg-emerald-950/30">
                        {checkinMsg.detail.userName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="min-w-16 text-emerald-600/80 dark:text-emerald-400/80">对应活动:</span>
                      <span className="line-clamp-1 rounded bg-emerald-100/50 px-2 py-0.5 font-semibold text-emerald-900 dark:bg-emerald-950/30">
                        {checkinMsg.detail.eventTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="min-w-16 text-emerald-600/80 dark:text-emerald-400/80">核销时间:</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {checkinMsg.detail.checkinTime}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 animate-in rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive duration-200 fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    <span className="text-sm font-semibold select-none">核销失败</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-5 rounded text-destructive/70 hover:bg-destructive/10"
                    onClick={() => setCheckinMsg(null)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
                <p className="mt-2 text-xs font-semibold">{checkinMsg.text}</p>
              </div>
            )
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: 编译测试**

  Run: `npx tsc --noEmit`
  Expected: 无类型错误。

- [ ] **Step 3: 提交修改**

  ```bash
  git add app/dashboard/checkin/page.tsx
  git commit -m "feat: 增加主办方门票扫码现场核销子页面 (/dashboard/checkin)"
  ```

---

### Task 6: 创建门票明细表子页面（/dashboard/tickets）

**Files:**
- Create: `app/dashboard/tickets/page.tsx`

- [ ] **Step 1: 编写搜索、筛选与 CSV 导出功能**

  编写 `app/dashboard/tickets/page.tsx`。

  ```tsx
  "use client"

  import { useEffect, useState } from "react"
  import { Loader2, Download, Calendar as CalendarIcon } from "lucide-react"
  import { Button } from "@/components/ui/button"
  import { Input } from "@/components/ui/input"
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
  import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
  import { Calendar } from "@/components/ui/calendar"
  import { format } from "date-fns"
  import { zhCN } from "date-fns/locale"
  import { cn, isTicketWithinDateRange } from "@/lib/utils"
  import { DateRange } from "react-day-picker"

  interface User {
    id: string
    name: string
    role: string
    email: string
  }

  interface DashboardTicketType {
    id: string
    ticketCode: string
    eventTitle: string
    userName: string
    userEmail: string
    status: string
    bookedAt: string
    updatedAt: string
  }

  export default function TicketsReportPage() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [dashboardTickets, setDashboardTickets] = useState<DashboardTicketType[]>([])

    // 过滤与导出相关状态
    const [searchQuery, setSearchQuery] = useState("")
    const [eventFilter, setEventFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

    const loadTicketsData = async (currUser: User) => {
      try {
        const res = await fetch(`/api/events/dashboard?organizerId=${currUser.id}`)
        const data = await res.json()
        if (data.tickets) {
          setDashboardTickets(data.tickets)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      const stored = localStorage.getItem("campus_user")
      if (stored) {
        const curr = JSON.parse(stored)
        setUser(curr)
        loadTicketsData(curr)
      }
    }, [])

    const filteredTickets = dashboardTickets.filter((t) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase())

      const matchEvent = eventFilter === "all" || t.eventTitle === eventFilter
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      const matchDate = isTicketWithinDateRange(t.bookedAt, dateRange)

      return matchSearch && matchEvent && matchStatus && matchDate
    })

    const handleExportCSV = () => {
      const headers = ["门票编号", "活动名称", "购票人", "联系邮箱", "当前状态", "订票时间"]
      const rows = filteredTickets.map((t) => [
        t.ticketCode,
        t.eventTitle,
        t.userName,
        t.userEmail,
        t.status === "USED" ? "已核销" : t.status === "UNUSED" ? "未使用" : "已取消",
        new Date(t.bookedAt).toLocaleString("zh-CN"),
      ])

      const csvContent =
        "\uFEFF" +
        [
          headers.join(","),
          ...rows.map((e) =>
            e.map((val) => `"${(val || "").replace(/"/g, '""')}"`).join(",")
          ),
        ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `event_tickets_export_${new Date().toISOString().slice(0, 10)}.csv`
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    if (loading || !user) {
      return (
        <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">门票核销明细表</h1>
          <p className="text-sm text-muted-foreground mt-1">查询、过滤门票核销记录，并支持将数据导出为 Excel CSV 格式</p>
        </div>

        <div className="space-y-4">
          {/* 筛选与导出栏 */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-border/60 bg-muted/50 p-3 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="text"
                placeholder="搜索购票人姓名/邮箱/票号"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full bg-background text-[11px] text-foreground sm:w-48"
              />
              <Select value={eventFilter} onValueChange={(val) => setEventFilter(val || "all")}>
                <SelectTrigger className="h-8 max-w-xs min-w-44 bg-background text-[11px] text-foreground">
                  <SelectValue placeholder="所有活动">
                    {eventFilter === "all" ? "所有活动" : eventFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60 w-auto max-w-xs min-w-55 overflow-y-auto rounded-lg border border-border bg-popover shadow-md sm:max-w-md">
                  <SelectGroup>
                    <SelectItem value="all">所有活动</SelectItem>
                    {Array.from(new Set(dashboardTickets.map((t) => t.eventTitle))).map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
                <SelectTrigger className="h-8 w-28 bg-background text-[11px] text-foreground">
                  <SelectValue placeholder="所有状态">
                    {statusFilter === "all"
                      ? "所有状态"
                      : statusFilter === "UNUSED"
                        ? "未使用"
                        : statusFilter === "USED"
                          ? "已核销"
                          : "已取消"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-lg border border-border bg-popover shadow-md">
                  <SelectGroup>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="UNUSED">未使用</SelectItem>
                    <SelectItem value="USED">已核销</SelectItem>
                    <SelectItem value="CANCELLED">已取消</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* 日期范围筛选 */}
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "flex h-8 min-w-44 cursor-pointer items-center justify-start gap-1.5 rounded-lg border border-border bg-background py-2 pr-2 pl-2.5 text-left text-xs whitespace-nowrap text-muted-foreground outline-hidden transition-colors select-none hover:bg-muted",
                    !dateRange?.from && "text-muted-foreground/80"
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/80" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "yyyy-MM-dd")} ~{" "}
                        {format(dateRange.to, "yyyy-MM-dd")}
                      </>
                    ) : (
                      format(dateRange.from, "yyyy-MM-dd")
                    )
                  ) : (
                    "选择订票日期范围"
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-lg border border-border bg-popover p-0 shadow-md" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={zhCN}
                    className="bg-popover text-foreground"
                  />
                </PopoverContent>
              </Popover>
              {dateRange && (dateRange.from || dateRange.to) && (
                <Button
                  variant="ghost"
                  onClick={() => setDateRange(undefined)}
                  className="h-8 cursor-pointer px-2 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  清除日期
                </Button>
              )}
            </div>

            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="flex h-8 w-fit items-center gap-1 self-end border-border px-3 text-[11px] font-semibold text-muted-foreground hover:bg-muted md:self-auto"
            >
              <Download className="h-3.5 w-3.5" />
              导出 CSV 数据
            </Button>
          </div>

          {/* 门票明细数据表格 */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/70 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  <th className="p-3">购票人</th>
                  <th className="p-3">电子票号</th>
                  <th className="p-3">活动名称</th>
                  <th className="p-3">当前状态</th>
                  <th className="p-3">订票时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-muted-foreground">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-bold text-foreground/90">{t.userName}</div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground/80">{t.userEmail}</div>
                    </td>
                    <td className="p-3 font-mono text-muted-foreground select-all">{t.ticketCode}</td>
                    <td className="max-w-35 truncate p-3 font-medium text-foreground/80" title={t.eventTitle}>
                      {t.eventTitle}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          t.status === "USED"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                            : t.status === "UNUSED"
                              ? "border-border bg-secondary text-secondary-foreground"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                        )}
                      >
                        {t.status === "USED" ? "已核销" : t.status === "UNUSED" ? "未使用" : "已取消"}
                      </span>
                    </td>
                    <td className="p-3 text-[10px] text-muted-foreground/80">
                      {new Date(t.bookedAt).toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
                {filteredTickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground/80">
                      暂无匹配的门票销售记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: 编译测试**

  Run: `npx tsc --noEmit`
  Expected: 无类型错误。

- [ ] **Step 3: 提交修改**

  ```bash
  git add app/dashboard/tickets/page.tsx
  git commit -m "feat: 增加主办方门票核销明细报表子页面 (/dashboard/tickets)"
  ```

---

### Task 7: 编译与项目整体完整性验证

**Files:**
- Modify: `components/navbar.tsx`

- [ ] **Step 1: 微调顶部全局 Navbar**

  因为控制台内部提供了侧边栏，原本在顶部 Navbar 里的“控制台 (Username)”链接我们可以保持原样指向 `/dashboard`。不过在侧边栏结构下，我们不需要在 Navbar 中重复显示用户的退出按钮，或者可以将其保留在 Navbar 中作为快捷方式。由于我们要尽可能少的变动非必要修改（精确修改原则），我们不优化周边没有问题的顶栏，仅在 `components/navbar.tsx` 中保留原有跳转到控制台逻辑即可。

- [ ] **Step 2: 运行整体 TypeScript 检查与项目构建**

  Run: `pnpm run build`
  Expected: 构建成功，没有 TypeScript 类型报错，Lint 检查通过。
