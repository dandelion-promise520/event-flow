"use client"

import { useEffect, useState } from "react"
import {
  Loader2,
  Plus,
  Trash2,
  Megaphone,
  Download,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Calendar } from "@/components/ui/calendar"
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
  capacity?: number
  bookedCount?: number
  soldCount?: number
  checkedInCount?: number
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

  // 主办方创建活动表单状态
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [capacity, setCapacity] = useState("50")
  const [category, setCategory] = useState("学术讲座")
  const [eventMsg, setEventMsg] = useState("")

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

  // 门票核销码状态
  const [ticketCodeInput, setTicketCodeInput] = useState("")
  const [checkinMsg, setCheckinMsg] = useState<{
    text: string
    type: "success" | "error"
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
        setBroadcastMsg("广播消息已成功群发给所有购票者！")
        setBroadcastContent("")
        setTimeout(() => {
          setBroadcastEventId(null)
          setBroadcastTitle("")
          setBroadcastContent("")
          setBroadcastMsg("")
        }, 1500)
      } else {
        setBroadcastMsg(data.message || "群发广播失败")
      }
    } catch {
      setBroadcastMsg("广播接口故障")
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
  }, [])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setEventMsg("")

    if (!selectedDate) {
      setEventMsg("请选择活动开始日期")
      return
    }

    const selectedDateTime = new Date(startTime)
    if (selectedDateTime.getTime() - Date.now() < -60 * 1000) {
      setEventMsg("活动开始时间不能早于当前时间")
      return
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          startTime,
          endTime,
          capacity,
          category,
          organizerId: user.id,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEventMsg("活动创建并发布成功！")
        // 清空表单
        setTitle("")
        setDescription("")
        setLocation("")
        setSelectedDate(undefined)
        setSelectedHour("09")
        setSelectedMinute("00")
        loadDashboardData(user)
      } else {
        setEventMsg(data.message || "创建失败")
      }
    } catch {
      setEventMsg("接口故障")
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
          text: `核销成功: ${data.detail.userName} 已进入 ${data.detail.eventTitle}`,
          type: "success",
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
    if (!confirm("确定要删除此活动吗？")) return
    await fetch(`/api/events?id=${id}`, { method: "DELETE" })
    loadDashboardData(user)
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-900 dark:text-white" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">个人控制台</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            欢迎回来，{user.name} ({user.role === "USER" ? "学生" : "主办方"})
          </p>
        </div>
      </div>

      {user.role === "USER" ? (
        /* 学生控制台 - 查看电子票根 */
        <div className="mt-10">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">我的活动门票</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="relative flex flex-col justify-between rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 p-6 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      {t.event.category}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        t.status === "UNUSED"
                          ? "text-neutral-900 dark:text-neutral-100"
                          : "text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {t.status === "UNUSED" ? "● 待核销" : "● 已使用"}
                    </span>
                  </div>
                  <h3 className="mt-3 line-clamp-1 font-bold text-neutral-900 dark:text-white">
                    {t.event.title}
                  </h3>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    地点: {t.event.location}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    时间: {new Date(t.event.startTime).toLocaleString("zh-CN")}
                  </p>
                </div>

                <div className="-mx-6 mt-6 -mb-6 flex flex-col gap-2 rounded-b-2xl border-t border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-zinc-950 p-6 pt-4">
                  <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
                    电子入场密钥 (核销码)
                  </span>
                  <span className="font-mono text-sm font-bold text-neutral-800 dark:text-neutral-200 select-all">
                    {t.ticketCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {tickets.length === 0 && (
            <p className="mt-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
              目前还没有订购任何活动门票
            </p>
          )}
        </div>
      ) : (
        /* 主办方控制台 - 发布活动 & 核销门票 */
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          {/* 左侧：发布活动表单 & 扫码核销 */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            {/* 活动核销 */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
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
                  className="h-10 flex-1 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100"
                />
                <Button
                  type="submit"
                  className="h-10 px-4 text-xs font-semibold"
                >
                  一键核销
                </Button>
              </form>
              {checkinMsg && (
                <Alert
                  variant={
                    checkinMsg.type === "success" ? "default" : "destructive"
                  }
                  className={cn(
                    "mt-3 transition-all duration-300",
                    checkinMsg.type === "success"
                      ? "border-emerald-100 bg-emerald-50/60 text-emerald-800 *:data-[slot=alert-description]:text-emerald-700 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-emerald-400 *:data-[slot=alert-description]:dark:text-emerald-400/90"
                      : "border-rose-100 bg-rose-50/60 text-rose-800 *:data-[slot=alert-description]:text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-400 *:data-[slot=alert-description]:dark:text-rose-400/90"
                  )}
                >
                  {checkinMsg.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  )}
                  <AlertTitle className="font-semibold select-none">
                    {checkinMsg.type === "success" ? "核销成功" : "核销失败"}
                  </AlertTitle>
                  <AlertDescription>{checkinMsg.text}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* 创建活动 */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-neutral-900 dark:text-white">
                发布全新活动
              </h2>
              <form onSubmit={handleCreateEvent}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>活动名称</FieldLabel>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>活动分类</FieldLabel>
                    <Select
                      value={category}
                      onValueChange={(val) => setCategory(val || "")}
                      items={categories}
                    >
                      <SelectTrigger className="w-full bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {categories.map((cat) => (
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
                      className="bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>开始日期</FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          className={cn(
                            "flex h-8 w-full cursor-pointer items-center justify-start gap-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-950 py-2 pr-2 pl-2.5 text-left text-xs whitespace-nowrap outline-hidden transition-colors select-none hover:bg-neutral-50 dark:hover:bg-zinc-900 text-neutral-900 dark:text-neutral-100",
                            !selectedDate && "text-muted-foreground dark:text-neutral-500"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                          {selectedDate
                            ? format(selectedDate, "yyyy-MM-dd")
                            : "选择日期"}
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-950 p-0 shadow-md"
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
                          <SelectTrigger className="h-8 w-20 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 text-xs">
                            <SelectValue placeholder="时" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-950 shadow-md">
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
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">:</span>
                        <Select
                          value={selectedMinute}
                          onValueChange={handleMinuteChange}
                        >
                          <SelectTrigger className="h-8 w-20 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 text-xs">
                            <SelectValue placeholder="分" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-950 shadow-md">
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
                        className="h-8 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 text-xs"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>名额上限 (张)</FieldLabel>
                      <Input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        required
                        className="h-8 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 text-xs"
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

                  <Button
                    type="submit"
                    className="h-10 w-full cursor-pointer font-semibold"
                    disabled={
                      eventMsg === "活动开始时间不能早于当前时间" ||
                      !selectedDate
                    }
                  >
                    <Plus data-icon="inline-start" />
                    确认发布活动
                  </Button>
                </FieldGroup>
              </form>
            </div>
          </div>

          {/* 右侧：选项卡面板 */}
          <div className="flex min-h-125 flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 p-6 shadow-sm lg:col-span-7">
            {/* Tabs Header */}
            <div className="flex gap-6 border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <button
                onClick={() => setActiveTab("events")}
                className={`relative pb-2 text-sm font-bold transition-all ${
                  activeTab === "events"
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400"
                }`}
              >
                活动管理
                {activeTab === "events" && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-neutral-900 dark:bg-white" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`relative pb-2 text-sm font-bold transition-all ${
                  activeTab === "tickets"
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400"
                }`}
              >
                门票核销明细表
                {activeTab === "tickets" && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-neutral-900 dark:bg-white" />
                )}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="mt-4 flex-1">
              {activeTab === "events" ? (
                /* 活动管理列表 */
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {createdEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
                          {evt.title}
                        </h3>
                        <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
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
                          onClick={() => {
                            setBroadcastEventId(evt.id)
                            setBroadcastTitle(`关于活动《${evt.title}》的通知`)
                            setBroadcastContent("")
                            setBroadcastMsg("")
                          }}
                          className="flex h-8 items-center gap-1 px-3 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-zinc-800"
                        >
                          <Megaphone className="h-3 w-3" />
                          群发消息
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="h-8 w-8 text-neutral-400 dark:text-neutral-500 hover:border-red-200 dark:hover:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {createdEvents.length === 0 && (
                    <p className="py-8 text-center text-xs text-neutral-400">
                      目前未发布任何活动
                    </p>
                  )}
                </div>
              ) : (
                /* 门票核销明细表 */
                <div className="space-y-4">
                  {/* 筛选与导出栏 */}
                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-zinc-950/50 p-3 md:flex-row md:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="text"
                        placeholder="搜索购票人姓名/邮箱/票号"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 w-full bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 text-[11px] sm:w-48"
                      />
                      <Select
                        value={eventFilter}
                        onValueChange={(val) => setEventFilter(val || "all")}
                      >
                        <SelectTrigger className="h-8 max-w-xs min-w-44 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 text-[11px]">
                          <SelectValue placeholder="所有活动">
                            {eventFilter === "all" ? "所有活动" : eventFilter}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="z-50 max-h-60 w-auto max-w-xs min-w-55 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-950 shadow-md sm:max-w-md"
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
                        <SelectTrigger className="h-8 w-28 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 text-[11px]">
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
                        <SelectContent className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-950 shadow-md">
                          <SelectGroup>
                            <SelectItem value="all">所有状态</SelectItem>
                            <SelectItem value="UNUSED">未使用</SelectItem>
                            <SelectItem value="USED">已核销</SelectItem>
                            <SelectItem value="CANCELLED">已取消</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleExportCSV}
                      variant="outline"
                      className="flex h-8 w-fit items-center gap-1 self-end border-neutral-300 dark:border-neutral-800 px-3 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-zinc-800 md:self-auto"
                    >
                      <Download className="h-3.5 w-3.5" />
                      导出 CSV 数据
                    </Button>
                  </div>

                  {/* 门票明细数据表格 */}
                  <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-zinc-950/70 text-[10px] font-bold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
                          <th className="p-3">购票人</th>
                          <th className="p-3">电子票号</th>
                          <th className="p-3">活动名称</th>
                          <th className="p-3">当前状态</th>
                          <th className="p-3">订票时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs text-neutral-700 dark:text-neutral-300">
                        {filteredTickets.map((t) => (
                          <tr
                            key={t.id}
                            className="transition-colors hover:bg-neutral-50/30 dark:hover:bg-zinc-800/30"
                          >
                            <td className="p-3">
                              <div className="font-bold text-neutral-800 dark:text-neutral-100">
                                {t.userName}
                              </div>
                              <div className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                                {t.userEmail}
                              </div>
                            </td>
                            <td className="p-3 font-mono text-neutral-600 dark:text-neutral-400 select-all">
                              {t.ticketCode}
                            </td>
                            <td
                              className="max-w-35 truncate p-3 font-medium text-neutral-700 dark:text-neutral-350"
                              title={t.eventTitle}
                            >
                              {t.eventTitle}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  t.status === "USED"
                                    ? "border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                                    : t.status === "UNUSED"
                                      ? "border border-border dark:border-neutral-800 bg-secondary text-secondary-foreground"
                                      : "border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                                }`}
                              >
                                {t.status === "USED"
                                  ? "已核销"
                                  : t.status === "UNUSED"
                                    ? "未使用"
                                    : "已取消"}
                              </span>
                            </td>
                            <td className="p-3 text-[10px] text-neutral-400 dark:text-neutral-500">
                              {new Date(t.bookedAt).toLocaleString("zh-CN")}
                            </td>
                          </tr>
                        ))}
                        {filteredTickets.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="p-8 text-center text-neutral-400"
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
      )}

      {/* 广播弹窗 */}
      {broadcastEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 p-6 shadow-xl duration-200 fade-in zoom-in">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">群发广播通知</h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              向所有订购该活动门票的用户发送站内信通知。
            </p>

            <form onSubmit={handleSendBroadcast} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  通知标题
                </label>
                <Input
                  type="text"
                  placeholder="请输入通知标题，如：活动场地变更"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="mt-1 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  通知内容
                </label>
                <Textarea
                  placeholder="请输入通知的详细内容..."
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  required
                  rows={4}
                  className="mt-1 bg-white dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {broadcastMsg && (
                <p
                  className={`text-xs font-semibold ${broadcastMsg.includes("成功") ? "text-emerald-600" : "text-red-600"}`}
                >
                  {broadcastMsg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBroadcastEventId(null)
                    setBroadcastTitle("")
                    setBroadcastContent("")
                    setBroadcastMsg("")
                  }}
                  disabled={broadcastLoading}
                  className="h-9 px-4 text-xs"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={broadcastLoading}
                  className="h-9 bg-neutral-900 px-4 text-xs text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                >
                  {broadcastLoading ? "发送中..." : "确定发送"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
