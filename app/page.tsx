"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import EventCard, { EventItem } from "@/components/event-card"
import {
  Search,
  Ticket,
  CheckCircle,
  QrCode,
  ArrowRight,
  Play,
  RefreshCw,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { toast } from "sonner"

// Inline SVG club logos - simple monograms matching page style
function ClubLogo({ initial, label }: { initial: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-80 transition-opacity duration-300">
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={label}
      >
        <rect
          width="32"
          height="32"
          rx="8"
          className="fill-foreground/10"
        />
        <text
          x="16"
          y="21"
          textAnchor="middle"
          className="fill-foreground"
          fontSize="13"
          fontWeight="600"
          fontFamily="var(--font-sans)"
        >
          {initial}
        </text>
      </svg>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
    </div>
  )
}

// Animated ticket status badge
function StatusBadge({ status }: { status: "UNUSED" | "USED" | "CANCELLED" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider",
        status === "UNUSED" && "bg-brand/10 text-brand",
        status === "USED" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        status === "CANCELLED" && "bg-muted text-muted-foreground"
      )}
    >
      {status === "UNUSED" && "未使用"}
      {status === "USED" && "已入场"}
      {status === "CANCELLED" && "已取消"}
    </span>
  )
}

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("campus_user")
    if (stored) {
      try {
        setTimeout(() => {
          setUser(JSON.parse(stored))
        }, 0)
      } catch (err) {
        console.error("加载用户信息失败:", err)
      }
    }
  }, [])

  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [keyword, setKeyword] = useState<string>("")
  const [dbCategories, setDbCategories] = useState<string[]>(["", "学术讲座", "文体比赛", "社团活动"])

  // Ticket simulator states
  const [ticketStatus, setTicketStatus] = useState<"UNUSED" | "USED" | "CANCELLED">("UNUSED")
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<string[]>([
    "12:05 张小明 成功预订了「羽毛球联谊赛」电子门票。",
    "13:10 李华 的电子门票 EV-5566-B1 核销成功。",
    "14:22 系统管理员审核通过了「AI 论坛」发布申请。",
  ])

  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setDbCategories(["", ...data.map((c: { name: string }) => c.name)])
          }
        }
      } catch (err) {
        console.error("加载分类失败:", err)
      }
    }
    fetchCats()
  }, [])

  const fetchEvents = useCallback(async () => {
    let url = `/api/events`
    if (selectedCategory) {
      url += `?category=${encodeURIComponent(selectedCategory)}`
    }
    const res = await fetch(url)
    const data = await res.json()
    setEvents(data)
  }, [selectedCategory])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchEvents])

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(keyword.toLowerCase())
  )

  // Simulator actions
  const triggerScan = () => {
    if (ticketStatus !== "UNUSED") {
      toast.error("当前门票状态不可核销")
      return
    }
    setIsScanning(true)
    toast.info("模拟扫码核销中...")
    setTimeout(() => {
      setIsScanning(false)
      setTicketStatus("USED")
      const nowStr = new Date().toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })
      setNotifications((prev) => [
        `${nowStr} 门票 EV-8899-X7 在一号入口核销成功。`,
        ...prev,
      ])
      toast.success("门票核销成功，学生已入场。")
    }, 1500)
  }

  const cancelTicket = () => {
    if (ticketStatus === "CANCELLED") return
    setTicketStatus("CANCELLED")
    const nowStr = new Date().toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
    setNotifications((prev) => [
      `${nowStr} 用户取消了门票 EV-8899-X7 的预订。`,
      ...prev,
    ])
    toast.warning("已取消该门票预订。")
  }

  const resetTicket = () => {
    setTicketStatus("UNUSED")
    const nowStr = new Date().toLocaleTimeString("zh-CN", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
    setNotifications((prev) => [
      `${nowStr} 测试门票 EV-8899-X7 已重置为未使用。`,
      ...prev,
    ])
    toast.info("已重置测试门票状态。")
  }

  // Entry animation variants - honors reduced motion
  const fadeUp = {
    initial: shouldReduceMotion ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* ── 1. HERO (Split asymmetric layout) ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-12">

          {/* Left: copy column */}
          <motion.div
            {...fadeUp}
            className="flex flex-col items-start text-left lg:col-span-5"
          >
            {/* Eyebrow - only ONE for the entire page top */}
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">
              校园活动票务平台
            </span>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight leading-[1.1] text-foreground md:text-5xl lg:text-[3.5rem]">
              校园活动，<br />
              <span className="italic">一指即达</span>
            </h1>

            <p className="mt-5 max-w-[44ch] text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
              极速预订讲座与社团活动。电子门票自动生成，入场扫码完成核销。
            </p>

            {/* Search + CTAs */}
            <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="搜索感兴趣的活动..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border/70 pr-4 pl-10 text-sm bg-muted/30 focus:bg-background focus:border-brand/50 transition-all"
                />
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  onClick={() => {
                    const el = document.getElementById("events-catalog")
                    el?.scrollIntoView({ behavior: "smooth" })
                  }}
                  className="h-10 rounded-xl px-5 text-sm font-semibold bg-brand text-brand-foreground hover:bg-brand/90 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.08)] active:scale-[0.97]"
                >
                  浏览活动
                </Button>
                <Button
                  render={<Link href="/login" />}
                  variant="outline"
                  nativeButton={false}
                  className="h-10 rounded-xl px-4 text-sm font-semibold border-border hover:bg-muted transition-all active:scale-[0.97]"
                >
                  登录
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Right: hero image with floating overlay */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center lg:col-span-7"
          >
            <div className="relative w-full max-w-[580px] rounded-2xl overflow-hidden shadow-2xl border border-border/30 group aspect-[16/10]">
              <Image
                src="/images/campus_hero_bg.jpg"
                alt="校园活动场景"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 700px"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              {/* Subtle dark gradient for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {/* Floating overlay card */}
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-white/55 mb-0.5">下一场活动</p>
                    <h4 className="text-sm font-bold truncate">AI 时代校园技术创新论坛</h4>
                  </div>
                  <span className="shrink-0 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white">
                    今天 19:30
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── 2. SOCIAL PROOF (Logo wall under hero) ─────────────────────── */}
      <section className="border-y border-border/30 bg-muted/15 py-7">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-[10px] font-semibold tracking-[0.2em] text-muted-foreground/50 uppercase mb-6">
            联合校园组织
          </p>
          <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-5">
            <ClubLogo initial="CS" label="计算机协会" />
            <ClubLogo initial="艺" label="大学生艺术团" />
            <ClubLogo initial="志" label="青年志愿者协会" />
            <ClubLogo initial="体" label="校体育部" />
            <ClubLogo initial="创" label="学术创新基地" />
          </div>
        </div>
      </section>

      {/* ── 3. CAPABILITIES BENTO (4 cells: 2+1 / 1+2) ─────────────────── */}
      {/*
        Eyebrow budget: Hero used 1. Bento gets 0 (next allowed at 4th section).
        Layout: top row = [2-col ticket wallet] + [1-col scan simulator]
                bottom row = [1-col stats] + [2-col notification log]
      */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Left-aligned section header - no eyebrow (see budget above) */}
        <div className="max-w-xl mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            更智能的票务管理，<br />触手可及
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            极简设计，全链路核销能力，带来顺畅的订票与验票体验。
          </p>
        </div>

        {/* Bento Grid: 3-col responsive */}
        <div className="grid gap-5 md:grid-cols-3">

          {/* Cell 1: Digital Ticket Wallet — col-span-2, tinted background */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-xs md:col-span-2 group">
            {/* Decorative gradient blob - not a grid pattern, not AI-purple */}
            <div className="absolute right-0 top-0 -z-10 size-40 bg-[radial-gradient(circle_at_70%_30%,var(--color-brand)/8%,transparent_65%)]" />

            <div>
              <h3 className="text-base font-bold text-foreground">学生电子票夹</h3>
              <p className="mt-1.5 text-xs text-muted-foreground max-w-[42ch]">
                告别纸质门票，电子票码防伪设计，支持退票与状态实时同步。
              </p>
            </div>

            {/* Ticket Simulator */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-5 rounded-xl border border-border/30 bg-muted/30 p-4 relative overflow-hidden">
              {/* Scanning laser animation */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    className="absolute inset-x-0 h-0.5 bg-brand/80 shadow-[0_0_10px_var(--color-brand)]"
                    initial={{ translateY: 0 }}
                    animate={{ translateY: "100%" }}
                    transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
                    style={{ top: 0, willChange: "transform" }}
                  />
                )}
              </AnimatePresence>

              {/* Ticket details */}
              <div className="flex flex-col gap-3 text-left w-full sm:w-auto">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground mb-0.5">EVENT TICKET</p>
                  <h4 className="text-sm font-bold text-foreground">AI 时代校园技术创新论坛</h4>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">TIME</span>
                    <span className="font-medium text-foreground">今天 19:30</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase">VENUE</span>
                    <span className="font-medium text-foreground">大礼堂</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block text-[9px] uppercase">CODE</span>
                    <span className="font-mono font-medium text-brand">EV-8899-X7</span>
                  </div>
                </div>
              </div>

              {/* QR + Status */}
              <div className="flex flex-col items-center gap-2.5 bg-card/60 p-3 rounded-xl border border-border/30 min-w-[110px]">
                <div className="relative size-[72px] bg-white p-1 rounded-lg">
                  <QrCode className="size-full text-zinc-900" />
                  {ticketStatus === "USED" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center"
                    >
                      <CheckCircle className="size-6 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 mt-0.5">已核销</span>
                    </motion.div>
                  )}
                  {ticketStatus === "CANCELLED" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center"
                    >
                      <XCircle className="size-6 text-destructive" />
                      <span className="text-[10px] font-bold text-destructive mt-0.5">已退票</span>
                    </motion.div>
                  )}
                </div>
                <StatusBadge status={ticketStatus} />
              </div>
            </div>
          </div>

          {/* Cell 2: Scan Simulator — col-span-1, dark tinted for variety */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-xs group">
            <div>
              <h3 className="text-base font-bold text-foreground">核销端模拟器</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                模拟主办方扫码核销，改变左侧门票状态。
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                onClick={triggerScan}
                disabled={ticketStatus !== "UNUSED" || isScanning}
                className={cn(
                  "w-full h-9 rounded-xl text-sm font-semibold transition-all gap-1.5 active:scale-[0.97]",
                  ticketStatus === "UNUSED"
                    ? "bg-brand text-brand-foreground hover:bg-brand/90"
                    : "bg-muted text-muted-foreground border border-border/30"
                )}
              >
                {isScanning ? (
                  <RefreshCw data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Play data-icon="inline-start" />
                )}
                {isScanning ? "核销中..." : "模拟扫码签到"}
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={cancelTicket}
                  disabled={ticketStatus === "CANCELLED" || isScanning}
                  variant="outline"
                  className="flex-1 h-9 rounded-xl text-xs font-semibold border-border/50 text-destructive hover:bg-destructive/10 active:scale-[0.97]"
                >
                  模拟退票
                </Button>
                <Button
                  onClick={resetTicket}
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-border/50 text-muted-foreground hover:text-foreground active:scale-[0.97]"
                  title="重置门票"
                >
                  <RefreshCw />
                </Button>
              </div>
            </div>
          </div>

          {/* Cell 3: Key Metrics — col-span-1, large display numbers (no progress bars) */}
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border/40 bg-brand/5 dark:bg-brand/10 p-6 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-foreground">核心数据</h3>
              <p className="mt-1 text-xs text-muted-foreground">实时活动运营概况</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-3xl font-extrabold text-brand tracking-tight">88.2<span className="text-xl">%</span></p>
                <p className="text-[11px] text-muted-foreground mt-0.5">讲座报名率</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-brand tracking-tight">94.2<span className="text-xl">%</span></p>
                <p className="text-[11px] text-muted-foreground mt-0.5">入场核销率</p>
              </div>
              <div className="col-span-2 pt-2 border-t border-border/30">
                <p className="text-2xl font-extrabold text-foreground tracking-tight">1,248</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">测试订票总量</p>
              </div>
            </div>
          </div>

          {/* Cell 4: Notification Log — col-span-2, divide-y instead of per-row cards */}
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-xs md:col-span-2">
            <div>
              <h3 className="text-base font-bold text-foreground">实时事件流</h3>
              <p className="mt-1 text-xs text-muted-foreground">活动审核、票务预订与入场核销的实时动态。</p>
            </div>

            {/* divide-y list pattern instead of per-row card containers */}
            <div className="divide-y divide-border/30">
              <AnimatePresence initial={false}>
                {notifications.slice(0, 4).map((note, index) => (
                  <motion.div
                    key={note + index}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="flex items-start gap-2.5 py-2.5 text-xs text-muted-foreground first:pt-0 last:pb-0"
                  >
                    <span className="mt-0.5 size-1.5 rounded-full bg-brand/50 shrink-0 translate-y-[1px]" />
                    <span>{note}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </section>

      {/* ── 4. EVENT DISCOVERY ─────────────────────────────────────────── */}
      {/* Eyebrow budget: 2 of 3 used (Hero + upcoming). Using 1 here for the section. */}
      <section id="events-catalog" className="mx-auto max-w-7xl px-6 py-16 border-t border-border/30">
        <div className="flex flex-col items-start mb-8">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand mb-3">
            活动大厅
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            探索校园活动
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            筛选分类，一键查看详情与在线预订电子门票。
          </p>
        </div>

        {/* Category filter - Apple Segmented style */}
        <ToggleGroup
          value={[selectedCategory]}
          onValueChange={(val) => {
            if (val && val.length > 0) {
              setSelectedCategory(val[0])
            } else {
              setSelectedCategory("")
            }
          }}
          className="p-1 rounded-2xl bg-muted/50 border border-border/40 max-w-fit shadow-xs"
        >
          {dbCategories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <ToggleGroupItem
                key={cat}
                value={cat}
                className={cn(
                  "h-8 rounded-[10px] px-4 text-xs font-medium transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "bg-background text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/30"
                )}
              >
                {cat || "全部"}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>

        {/* Event grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((evt, idx) => (
            <EventCard key={evt.id} event={evt} priority={idx < 4} />
          ))}
        </div>

        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center text-center py-10">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="size-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm text-muted-foreground">暂无符合条件的活动</p>
            <p className="text-xs text-muted-foreground/60 mt-1">请尝试切换分类或清空搜索关键词</p>
          </div>
        )}
      </section>

      {/* ── 5. TESTIMONIAL ─────────────────────────────────────────────── */}
      {/* Different layout family: full-bleed tinted, left-aligned, no center-alignment */}
      <section className="border-t border-border/20 bg-muted/10 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <blockquote className="text-lg font-medium text-foreground md:text-xl leading-relaxed">
              “通过本校园活动票务管理系统，学术讲座的签到核销效率提升了 90%。入场秩序井然，活动组织省时省力。”
            </blockquote>
            <div className="mt-5 flex items-center gap-3">
              <div className="size-9 rounded-full bg-brand/10 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                C
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground block">计算机协会负责人</span>
                <span className="text-muted-foreground text-xs">系统核心主办方</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. CTA STRIP (separate from hero CTA - different intent: login) */}
      {!user && (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-col items-start gap-6 rounded-2xl border border-border/40 bg-card p-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <h2 className="text-xl font-bold text-foreground md:text-2xl">准备好了吗？</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                登录后即可管理活动、发布门票与核销入场。
              </p>
            </div>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              className="h-10 rounded-xl px-6 text-sm font-semibold bg-brand text-brand-foreground hover:bg-brand/90 transition-all shrink-0 gap-2 active:scale-[0.97]"
            >
              登录系统
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border/20 py-8 bg-muted/5">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>2026 校园活动票务管理系统. Built with Next.js and Tailwind CSS.</p>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-foreground transition-colors">控制台入口</Link>
            <span className="text-border" aria-hidden>|</span>
            <a href="#" className="hover:text-foreground transition-colors">服务条款</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
