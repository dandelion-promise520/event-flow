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
