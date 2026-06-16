"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Loader2,
  Plus,
  Trash2,
  Megaphone,
  Download,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
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
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn, isTicketWithinDateRange } from "@/lib/utils"
import { DateRange } from "react-day-picker"
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
import DashboardAnalytics from "@/components/dashboard-analytics"
import type { EventData } from "@/lib/analytics-utils"

const categories = [
  { label: "学术讲座", value: "学术讲座" },
  { label: "文体比赛", value: "文体比赛" },
  { label: "社团活动", value: "社团活动" },
]

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
  checkedInCount?: number
  description?: string
  coverUrl?: string | null
}

interface TicketType {
  id: string
  status: string
  ticketCode: string
  event: EventType
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

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [createdEvents, setCreatedEvents] = useState<EventType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [dbCategories, setDbCategories] = useState<{ label: string; value: string }[]>([])

  // 主办方创建活动表单状态
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("50")
  const [category, setCategory] = useState("学术讲座")
  const [eventMsg, setEventMsg] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([])
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [originalStartTime, setOriginalStartTime] = useState<string | null>(
    null
  )

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

  // 日期时间选择器的局部状态
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedHour, setSelectedHour] = useState("09")
  const [selectedMinute, setSelectedMinute] = useState("00")

  // 计算日期时间字符串
  const startTime = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}T${selectedHour}:${selectedMinute}`
    : ""
  const endTime = startTime

  // 校验所选日期时间合法性并在选择时立刻提示
  const validateTime = (
    date: Date | undefined,
    hour: string,
    minute: string
  ) => {
    if (!date) {
      setEventMsg((prev) =>
        prev === "活动开始时间不能早于当前时间" || prev === "请选择活动开始日期"
          ? ""
          : prev
      )
      return
    }
    const tempStartTime = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${hour}:${minute}`

    // 如果是编辑模式，且时间等于原始时间，则不进行过去时间的校验
    if (editingEventId && tempStartTime === originalStartTime) {
      setEventMsg((prev) =>
        prev === "活动开始时间不能早于当前时间" ? "" : prev
      )
      return
    }

    const selectedDateTime = new Date(tempStartTime)
    if (selectedDateTime.getTime() - Date.now() < -60 * 1000) {
      setEventMsg("活动开始时间不能早于当前时间")
    } else {
      setEventMsg((prev) => {
        if (
          prev === "活动开始时间不能早于当前时间" ||
          prev === "请选择活动开始日期"
        ) {
          return ""
        }
        return prev
      })
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

    // 处理时间回显
    const start = new Date(evt.startTime)
    setSelectedDate(start)
    setSelectedHour(String(start.getHours()).padStart(2, "0"))
    setSelectedMinute(String(start.getMinutes()).padStart(2, "0"))

    // 处理已上传封面回显
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

    // 滚动到表单面板
    const formPanel = document.getElementById("event-form-panel")
    if (formPanel) {
      formPanel.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleCancelEdit = () => {
    setEditingEventId(null)
    setOriginalStartTime(null)
    setTitle("")
    setCategory(categories[0]?.value || "学术讲座")
    setDescription("")
    setLocation("")
    setCapacity("50")
    setSelectedDate(undefined)
    setSelectedHour("09")
    setSelectedMinute("00")
    setUploadedFiles([])
    setEventMsg("")
  }

  // 门票核销码状态
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

  // 看板与 Tab/明细状态
  const [activeTab, setActiveTab] = useState<"events" | "tickets">("events")
  const [dashboardTickets, setDashboardTickets] = useState<
    DashboardTicketType[]
  >([])
  const [searchQuery, setSearchQuery] = useState("")
  const [eventFilter, setEventFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  // 广播通知表单状态
  const [broadcastEventId, setBroadcastEventId] = useState<string | null>(null)
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastContent, setBroadcastContent] = useState("")
  const [broadcastMsg, setBroadcastMsg] = useState("")
  const [broadcastLoading, setBroadcastLoading] = useState(false)

  const loadDashboardData = async (currUser: User) => {
    try {
      if (currUser.role === "USER") {
        const res = await fetch(`/api/tickets?userId=${currUser.id}`)
        const data = await res.json()
        setTickets(data)
      } else {
        // 主办方/管理员获取自己发布的活动和看板明细数据
        const res = await fetch(
          `/api/events/dashboard?organizerId=${currUser.id}`
        )
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
      toast.error("获取活动数据失败，请重试！")
    } finally {
      setLoading(false)
    }
  }

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
    const headers = [
      "门票编号",
      "活动名称",
      "购票人",
      "联系邮箱",
      "当前状态",
      "订票时间",
    ]
    const rows = filteredTickets.map((t) => [
      t.ticketCode,
      t.eventTitle,
      t.userName,
      t.userEmail,
      t.status === "USED"
        ? "已核销"
        : t.status === "UNUSED"
          ? "未使用"
          : "已取消",
      new Date(t.bookedAt).toLocaleString("zh-CN"),
    ])

    const csvContent =
      "\uFEFF" + // 添加 UTF-8 BOM，防止 Excel 打开乱码
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

  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (!stored) {
      window.location.href = "/login"
      return
    }
    const curr = JSON.parse(stored)
    setTimeout(() => {
      setUser(curr)
      loadDashboardData(curr)
    }, 0)

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

  const handleCreateOrUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setEventMsg("")

    if (!selectedDate) {
      setEventMsg("请选择活动开始日期")
      return
    }

    const coverUrl =
      uploadedFiles.find((f) => f.status === "success")?.url || null

    try {
      let res
      if (editingEventId) {
        // 仅当时间被改动时，才做时间是否为过去的校验
        if (startTime !== originalStartTime) {
          const selectedDateTime = new Date(startTime)
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
            startTime,
            endTime,
            capacity,
            category,
          }),
        })
      } else {
        // 仅当新建活动时校验开始时间不能早于当前时间
        const selectedDateTime = new Date(startTime)
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
            startTime,
            endTime,
            capacity,
            category,
            organizerId: user.id,
          }),
        })
      }

      const data = await res.json()
      if (data.success) {
        toast.success(
          editingEventId ? "活动更新成功！" : "活动创建并发布成功！"
        )
        handleCancelEdit()
        loadDashboardData(user)
      } else {
        setEventMsg(data.message || (editingEventId ? "更新失败" : "创建失败"))
        toast.error(data.message || (editingEventId ? "更新失败" : "创建失败"))
      }
    } catch {
      setEventMsg("接口故障")
      toast.error("网络故障，操作失败")
    }
  }

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

  const handleDeleteEvent = async (id: string) => {
    if (!user) return
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast.success("活动已成功删除")
        loadDashboardData(user)
      } else {
        toast.error(data.message || "删除活动失败")
      }
    } catch {
      toast.error("网络异常，删除活动失败")
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-6 border-b border-border/60 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">个人控制台</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              欢迎回来，{user.name} ({user.role === "USER" ? "学生" : user.role === "ADMIN" ? "系统管理员" : "主办方"})
            </p>
          </div>
        </div>

        {user.role === "ADMIN" && (
          <div className="grid gap-4 sm:grid-cols-2">
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
              <span className="text-xl font-bold text-muted-foreground/50">
                📂
              </span>
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
              <span className="text-xl font-bold text-muted-foreground/50">
                👥
              </span>
            </Link>
          </div>
        )}
      </div>

      {user.role === "USER" ? (
        /* 学生控制台 - 查看电子票根 */
        <div className="mt-10">
          <h2 className="text-lg font-bold text-foreground">我的活动门票</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm"
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
      ) : (
        /* 主办方控制台 - 发布活动 & 核销门票 */
        <div className="mt-10 flex flex-col gap-8">
          <DashboardAnalytics events={createdEvents as unknown as EventData[]} tickets={dashboardTickets} />

          <div className="grid gap-10 lg:grid-cols-12">
            {/* 左侧：发布活动表单 & 扫码核销 */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            {/* 活动核销 */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-bold text-foreground">
                电子门票现场核销
              </h2>
              <form
                onSubmit={handleCheckin}
                className="mt-4 flex items-center gap-2"
              >
                <Input
                  type="text"
                  placeholder="输入门票代码 (e.g. EVT-...)"
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value)}
                  className="h-10 flex-1 bg-background text-foreground"
                />
                <Button
                  type="submit"
                  className="h-10 px-4 text-xs font-semibold"
                >
                  一键核销
                </Button>
              </form>
              {checkinMsg &&
                (checkinMsg.type === "success" ? (
                  <div className="mt-3 animate-in rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-emerald-800 duration-200 fade-in slide-in-from-top-1 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-emerald-400">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-semibold select-none">
                          核销成功
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-5 rounded text-emerald-600/70 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-400/70 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                        onClick={() => setCheckinMsg(null)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    {checkinMsg.detail && (
                      <div className="mt-3 flex flex-col gap-2 border-t border-emerald-100/50 pt-3 text-xs dark:border-emerald-950/20">
                        <div className="flex items-center gap-2">
                          <span className="min-w-16 text-emerald-600/80 dark:text-emerald-400/80">
                            入场人员:
                          </span>
                          <span className="rounded bg-emerald-100/50 px-2 py-0.5 font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            {checkinMsg.detail.userName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="min-w-16 text-emerald-600/80 dark:text-emerald-400/80">
                            对应活动:
                          </span>
                          <span className="line-clamp-1 rounded bg-emerald-100/50 px-2 py-0.5 text-left font-semibold text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                            {checkinMsg.detail.eventTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="min-w-16 text-emerald-600/80 dark:text-emerald-400/80">
                            核销时间:
                          </span>
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
                        <span className="text-sm font-semibold select-none">
                          核销失败
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-5 rounded text-destructive/70 hover:bg-destructive/15 hover:text-destructive"
                        onClick={() => setCheckinMsg(null)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    <p className="mt-2 pl-6 text-xs leading-relaxed text-destructive/90">
                      {checkinMsg.text}
                    </p>
                  </div>
                ))}
            </div>

            {/* 创建活动 */}
            <div
              id="event-form-panel"
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h2 className="mb-5 text-base font-bold text-foreground">
                {editingEventId ? "编辑活动内容" : "发布全新活动"}
              </h2>
              <form onSubmit={handleCreateOrUpdateEvent}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>活动名称</FieldLabel>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="bg-background text-foreground"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>活动分类</FieldLabel>
                    <Select
                      value={category}
                      onValueChange={(val) => setCategory(val || "")}
                      items={dbCategories.length > 0 ? dbCategories : categories}
                    >
                      <SelectTrigger className="w-full bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {(dbCategories.length > 0 ? dbCategories : categories).map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>活动描述</FieldLabel>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                      className="bg-background text-foreground"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>活动封面</FieldLabel>
                    <FileUploader
                      value={uploadedFiles}
                      onChange={setUploadedFiles}
                      onUpload={handleImageUpload}
                      maxCount={1}
                      accept="image/*"
                      maxSize={5}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>开始日期</FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          className={cn(
                            "flex h-8 w-full cursor-pointer items-center justify-start gap-1.5 rounded-lg border border-border bg-background py-2 pr-2 pl-2.5 text-left text-xs whitespace-nowrap text-foreground outline-hidden transition-colors select-none hover:bg-muted",
                            !selectedDate && "text-muted-foreground/80"
                          )}
                        >
                          <CalendarIcon className="size-4 text-muted-foreground/80" />
                          {selectedDate
                            ? format(selectedDate, "yyyy-MM-dd")
                            : "选择日期"}
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
                            disabled={{
                              before: new Date(new Date().setHours(0, 0, 0, 0)),
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </Field>
                    <Field>
                      <FieldLabel>具体时间</FieldLabel>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedHour}
                          onValueChange={handleHourChange}
                        >
                          <SelectTrigger className="h-8 w-20 bg-background text-xs text-foreground">
                            <SelectValue placeholder="时" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
                            <SelectGroup>
                              {Array.from({ length: 24 }, (_, i) =>
                                String(i).padStart(2, "0")
                              ).map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground/80">
                          :
                        </span>
                        <Select
                          value={selectedMinute}
                          onValueChange={handleMinuteChange}
                        >
                          <SelectTrigger className="h-8 w-20 bg-background text-xs text-foreground">
                            <SelectValue placeholder="分" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
                            <SelectGroup>
                              {Array.from({ length: 60 }, (_, i) =>
                                String(i).padStart(2, "0")
                              ).map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>地点</FieldLabel>
                      <Input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        className="h-8 bg-background text-xs text-foreground"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>名额上限 (张)</FieldLabel>
                      <Input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        required
                        className="h-8 bg-background text-xs text-foreground"
                      />
                    </Field>
                  </div>

                  {eventMsg && (
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        eventMsg.includes("成功")
                          ? "text-emerald-600"
                          : "text-rose-600"
                      )}
                    >
                      {eventMsg}
                    </p>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      type="submit"
                      className="h-10 w-full cursor-pointer font-semibold"
                      disabled={
                        !selectedDate ||
                        eventMsg === "活动开始时间不能早于当前时间"
                      }
                    >
                      {!editingEventId && <Plus data-icon="inline-start" />}
                      {editingEventId ? "保存修改" : "确认发布活动"}
                    </Button>
                    {editingEventId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-10 w-full cursor-pointer font-semibold"
                      >
                        取消编辑
                      </Button>
                    )}
                  </div>
                </FieldGroup>
              </form>
            </div>
          </div>

          {/* 右侧：选项卡面板 */}
          <div className="flex min-h-125 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-7">
            {/* Tabs Header */}
            <div className="flex gap-6 border-b border-border/60 pb-3">
              <button
                onClick={() => setActiveTab("events")}
                className={`relative pb-2 text-sm font-bold transition-all ${
                  activeTab === "events"
                    ? "text-foreground"
                    : "text-muted-foreground/80 hover:text-foreground"
                }`}
              >
                活动管理
                {activeTab === "events" && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-foreground" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`relative pb-2 text-sm font-bold transition-all ${
                  activeTab === "tickets"
                    ? "text-foreground"
                    : "text-muted-foreground/80 hover:text-foreground"
                }`}
              >
                门票核销明细表
                {activeTab === "tickets" && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-foreground" />
                )}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 flex-1">
              {activeTab === "events" ? (
                /* 活动管理列表 */
                <div className="divide-y divide-border">
                  {createdEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-foreground/90">
                          {evt.title}
                        </h3>
                        <p className="mt-1 text-[11px] text-muted-foreground/80">
                          地点: {evt.location} | 容量: {evt.capacity} 人 | 已售:{" "}
                          {evt.bookedCount} 张 | 已核销:{" "}
                          {evt.checkedInCount || 0} 张
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
                              <AlertDialogTitle>
                                确认删除此活动吗?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                此操作无法撤销
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteEvent(evt.id)}
                              >
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
              ) : (
                /* 门票核销明细表 */
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
                      <Select
                        value={eventFilter}
                        onValueChange={(val) => setEventFilter(val || "all")}
                      >
                        <SelectTrigger className="h-8 max-w-xs min-w-44 bg-background text-[11px] text-foreground">
                          <SelectValue placeholder="所有活动">
                            {eventFilter === "all" ? "所有活动" : eventFilter}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="z-50 max-h-60 w-auto max-w-xs min-w-55 overflow-y-auto rounded-lg border border-border bg-popover shadow-md sm:max-w-md"
                        >
                          <SelectGroup>
                            <SelectItem value="all">所有活动</SelectItem>
                            {Array.from(
                              new Set(dashboardTickets.map((t) => t.eventTitle))
                            ).map((title) => (
                              <SelectItem key={title} value={title}>
                                {title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Select
                        value={statusFilter}
                        onValueChange={(val) => setStatusFilter(val || "all")}
                      >
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
                        <PopoverContent
                          className="w-auto rounded-lg border border-border bg-popover p-0 shadow-md"
                          align="start"
                        >
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
                          className="h-8 cursor-pointer px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
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
                  <div className="overflow-x-auto rounded-xl border border-border">
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
                          <tr
                            key={t.id}
                            className="transition-colors hover:bg-muted/30"
                          >
                            <td className="p-3">
                              <div className="font-bold text-foreground/90">
                                {t.userName}
                              </div>
                              <div className="mt-0.5 text-[10px] text-muted-foreground/80">
                                {t.userEmail}
                              </div>
                            </td>
                            <td className="p-3 font-mono text-muted-foreground select-all">
                              {t.ticketCode}
                            </td>
                            <td
                              className="max-w-35 truncate p-3 font-medium text-foreground/80"
                              title={t.eventTitle}
                            >
                              {t.eventTitle}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  t.status === "USED"
                                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : t.status === "UNUSED"
                                      ? "border border-border bg-secondary text-secondary-foreground"
                                      : "border border-destructive/30 bg-destructive/10 text-destructive"
                                }`}
                              >
                                {t.status === "USED"
                                  ? "已核销"
                                  : t.status === "UNUSED"
                                    ? "未使用"
                                    : "已取消"}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] text-muted-foreground/80">
                              {new Date(t.bookedAt).toLocaleString("zh-CN")}
                            </td>
                          </tr>
                        ))}
                        {filteredTickets.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-8 text-center text-muted-foreground/80"
                            >
                              暂无匹配的门票销售记录
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

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
              <AlertDialogDescription>
                向所有订购该活动门票的用户发送站内信通知。
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground/80">
                  通知标题
                </label>
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
                <label className="text-xs font-bold text-foreground/80">
                  通知内容
                </label>
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
                <p
                  className={`text-xs font-semibold ${
                    broadcastMsg.includes("成功")
                      ? "text-emerald-600"
                      : "text-destructive"
                  }`}
                >
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
              <Button
                type="submit"
                disabled={broadcastLoading}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {broadcastLoading ? "发送中..." : "确定发送"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
