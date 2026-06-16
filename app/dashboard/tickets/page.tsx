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
