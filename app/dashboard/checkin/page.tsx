"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle, AlertDescription, AlertAction } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
    if (!stored) {
      window.location.href = "/login"
      return
    }
    const curr = JSON.parse(stored)
    if (curr.role !== "ORGANIZER" && curr.role !== "ADMIN") {
      toast.error("您没有权限访问此页面！")
      window.location.href = "/dashboard"
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(curr)
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

  const variants = {
    success: {
      alertVariant: "default" as const,
      className: "border-emerald-100 bg-emerald-50/60 text-emerald-800 dark:border-emerald-950/40 dark:bg-emerald-950/10 dark:text-emerald-400",
      icon: <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />,
      title: "核销成功",
    },
    error: {
      alertVariant: "destructive" as const,
      className: "",
      icon: <AlertCircle className="size-4" />,
      title: "核销失败",
    },
  }

  const config = checkinMsg ? variants[checkinMsg.type] : null

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

        {checkinMsg && config && (
          <Alert
            variant={config.alertVariant}
            className={cn("mt-3 animate-in duration-200 fade-in slide-in-from-top-1", config.className)}
          >
            {config.icon}
            <AlertTitle className="font-semibold select-none">
              {config.title}
            </AlertTitle>
            <AlertDescription className="mt-2 text-xs">
              {checkinMsg.type === "success" && checkinMsg.detail ? (
                <div className="mt-3 flex flex-col gap-2 border-t border-emerald-100/50 pt-3 dark:border-emerald-950/20">
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
              ) : (
                <p className="font-semibold">{checkinMsg.text}</p>
              )}
            </AlertDescription>
            <AlertAction>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "size-5 rounded text-current hover:bg-muted/10",
                  checkinMsg.type === "success"
                    ? "text-emerald-600/70 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-400/70 dark:hover:bg-emerald-950/40"
                    : "text-destructive/70 hover:bg-destructive/10"
                )}
                onClick={() => setCheckinMsg(null)}
              >
                <X className="size-3" />
              </Button>
            </AlertAction>
          </Alert>
        )}
      </div>
    </div>
  )
}
