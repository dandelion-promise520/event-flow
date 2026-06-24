"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import EventCard, { EventItem } from "@/components/event-card"
import { 
  Search, 
  Sparkles, 
  Ticket, 
  CheckCircle, 
  QrCode, 
  Activity, 
  Terminal, 
  ArrowRight, 
  Clock, 
  Play, 
  RefreshCw,
  XCircle,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [keyword, setKeyword] = useState<string>("")
  const [dbCategories, setDbCategories] = useState<string[]>(["", "学术讲座", "文体比赛", "社团活动"])

  // Interactive Simulator States
  const [ticketStatus, setTicketStatus] = useState<"UNUSED" | "USED" | "CANCELLED">("UNUSED")
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scanSuccess, setScanSuccess] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<string[]>([
    "12:05 - 系统管理员审核通过了新活动 'AI 论坛' 的发布申请。",
    "13:10 - 张小明 成功预订了 '羽毛球联谊赛' 电子门票。",
    "14:22 - 李华 的电子门票 'EV-5566-B1' 核销成功。"
  ])

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
        console.error("加载动态分类失败:", err)
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
      toast.error("当前门票状态不可核销！")
      return
    }
    setIsScanning(true)
    toast.info("模拟扫描枪已对准，核销中...")
    
    setTimeout(() => {
      setIsScanning(false)
      setTicketStatus("USED")
      setScanSuccess(true)
      const nowStr = new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: '2-digit', minute: '2-digit' })
      setNotifications(prev => [
        `${nowStr} - 门票 'EV-8899-X7' 在一号入口核销成功。`,
        ...prev
      ])
      toast.success("门票核销成功！学生已入场。")
    }, 1500)
  }

  const cancelTicket = () => {
    if (ticketStatus === "CANCELLED") return
    setTicketStatus("CANCELLED")
    const nowStr = new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: '2-digit', minute: '2-digit' })
    setNotifications(prev => [
      `${nowStr} - 用户取消了门票 'EV-8899-X7' 的预订。`,
      ...prev
    ])
    toast.warning("已取消该门票预订。")
  }

  const resetTicket = () => {
    setTicketStatus("UNUSED")
    setScanSuccess(false)
    const nowStr = new Date().toLocaleTimeString("zh-CN", { hour12: false, hour: '2-digit', minute: '2-digit' })
    setNotifications(prev => [
      `${nowStr} - 重置测试门票 'EV-8899-X7' 为未使用状态。`,
      ...prev
    ])
    toast.info("已重置测试门票状态。")
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-brand/20">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,var(--color-brand)/6%,transparent_50%)]" />

      {/* 1. HERO SECTION (Split layout) */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left info column */}
          <div className="flex flex-col items-start text-left lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-brand uppercase">
              <Sparkles className="size-3" />
              CAMPUS LIFE REDEFINED
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl leading-[1.1]">
              校园活动，一指即达
            </h1>
            <p className="mt-4 max-w-[45ch] text-sm text-muted-foreground/90 leading-relaxed md:text-base">
              极速预订学术讲座与社团活动。电子门票自动生成，入场扫码核销。
            </p>
            
            {/* Spotlight Search and CTAs */}
            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex flex-1 items-center">
                <Search className="absolute left-3.5 size-4 text-muted-foreground/60" />
                <Input
                  type="text"
                  placeholder="搜索感兴趣的活动..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border/70 pr-4 pl-10 text-xs shadow-sm transition-all duration-300 outline-none focus:border-brand/50 focus:bg-background/80 bg-muted/40 text-foreground"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => {
                    const el = document.getElementById("events-catalog");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="h-10 rounded-xl px-5 text-xs font-semibold bg-brand text-brand-foreground hover:bg-brand/90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                >
                  开始探索
                </Button>
                <Button 
                  render={<Link href="/login" />}
                  variant="outline"
                  nativeButton={false}
                  className="h-10 rounded-xl px-4 text-xs font-semibold border-border hover:bg-muted transition-all"
                >
                  系统登录
                </Button>
              </div>
            </div>
          </div>

          {/* Right graphics column - Floating interactive ticket preview */}
          <div className="relative flex justify-center lg:col-span-6">
            <div className="relative w-full max-w-[460px] aspect-[4/3] rounded-3xl border border-border/40 bg-card/40 p-5 backdrop-blur-xl shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 -z-10 bg-linear-to-tr from-brand/5 to-transparent opacity-60" />
              {/* Event Cover Image wrapper */}
              <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-inner">
                <Image
                  src="/images/hero_event_mockup.jpg"
                  alt="Campus Event Mockup"
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-102"
                />
                {/* Floating overlay card */}
                <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-black/40 p-3.5 backdrop-blur-md shadow-lg text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/60">NEXT EVENT</p>
                      <h4 className="text-xs font-bold mt-0.5">AI 时代校园技术创新论坛</h4>
                    </div>
                    <Badge variant="outline" className="border-white/20 bg-white/10 text-[10px] text-white">
                      19:30 今天
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUSTED BY / LOGO WALL (Under Hero) */}
      <section className="border-y border-border/30 bg-muted/20 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-[10px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
            TRUSTED BY CAMPUS CLUBS & ASSOCIATIONS
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs font-medium text-muted-foreground/60">
            <span className="hover:text-foreground/80 transition-colors">计算机协会</span>
            <span className="hover:text-foreground/80 transition-colors">大学生艺术团</span>
            <span className="hover:text-foreground/80 transition-colors">青年志愿者协会</span>
            <span className="hover:text-foreground/80 transition-colors">校体育部</span>
            <span className="hover:text-foreground/80 transition-colors">学术创新基地</span>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC BENTO GRID (Product Capabilities Showcase) */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            更智能的票务管理，触手可及
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground md:text-sm">
            极简的设计，强大的全链路核销能力，带给同学们如丝般顺滑的订票与验票体验。
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Cell 1: Digital Ticket Wallet (Col span 2) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/40 bg-card p-6 shadow-xs md:col-span-2 group">
            <div className="absolute right-0 top-0 -z-10 h-32 w-32 bg-[radial-gradient(circle,var(--color-brand)/4%,transparent_70%)]" />
            
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className="bg-brand/5 text-brand hover:bg-brand/10 border-transparent">
                <Ticket data-icon="inline-start" />
                学生电子票夹
              </Badge>
              <h3 className="text-lg font-bold text-foreground mt-2">我的电子门票</h3>
              <p className="text-xs text-muted-foreground max-w-[45ch]">
                告别传统纸质门票，极简电子票码防伪设计，支持退票与实时状态同步。
              </p>
            </div>

            {/* Ticket Simulator Container */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-2xl border border-border/40 bg-muted/40 p-4 relative">
              {/* Animated scanning laser */}
              {isScanning && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-brand/80 animate-bounce shadow-[0_0_12px_var(--color-brand)] z-20" />
              )}
              
              {/* Ticket Details */}
              <div className="flex flex-col gap-3 text-left w-full sm:w-auto">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground">EVENT TICKET</p>
                  <h4 className="text-sm font-bold text-foreground mt-0.5">AI 时代校园技术创新论坛</h4>
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

              {/* Status & QR Mockup */}
              <div className="flex flex-col items-center gap-3 bg-card/60 p-3 rounded-xl border border-border/30 backdrop-blur-xs min-w-[120px]">
                <div className="relative size-20 bg-white p-1 rounded-lg">
                  <QrCode className="size-full text-zinc-900" />
                  {/* Status Overlay */}
                  {ticketStatus === "USED" && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-[10px] font-bold text-brand animate-fade-in">
                      <CheckCircle className="size-6 text-brand fill-brand/10" />
                      <span>已核销</span>
                    </div>
                  )}
                  {ticketStatus === "CANCELLED" && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-[10px] font-bold text-red-500 animate-fade-in">
                      <XCircle className="size-6 text-red-400 fill-red-500/10" />
                      <span>已退票</span>
                    </div>
                  )}
                </div>

                {/* Badge Indicator */}
                <Badge
                  variant={ticketStatus === "CANCELLED" ? "outline" : "secondary"}
                  className={cn(
                    "text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full border-transparent",
                    ticketStatus === "UNUSED" && "bg-brand/10 text-brand hover:bg-brand/15",
                    ticketStatus === "USED" && "bg-brand/10 text-brand hover:bg-brand/15 dark:bg-brand/20 dark:text-brand",
                    ticketStatus === "CANCELLED" && "bg-muted text-muted-foreground"
                  )}
                >
                  {ticketStatus === "UNUSED" && "未使用"}
                  {ticketStatus === "USED" && "已入场"}
                  {ticketStatus === "CANCELLED" && "已取消"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Cell 2: Live Analytics (Col span 1) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/40 bg-card p-6 shadow-xs group">
            <div>
              <Badge variant="secondary" className="bg-brand/10 text-brand hover:bg-brand/15 border-transparent">
                <Activity data-icon="inline-start" />
                数据实时看板
              </Badge>
              <h3 className="text-lg font-bold text-foreground mt-3">核心数据大屏</h3>
              <p className="text-xs text-muted-foreground">
                实时的名额监控，精准查看每场活动的报名进度。
              </p>
            </div>

            {/* Quick stats visualization */}
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <span className="text-xs text-muted-foreground">讲座报名率</span>
                <span className="text-xs font-bold text-brand">88.2%</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/30 pb-2">
                <span className="text-xs text-muted-foreground">入场核销率</span>
                <span className="text-xs font-bold text-brand">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">测试订票总量</span>
                <span className="text-xs font-bold text-foreground">1,248 张</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-1">
                <div className="h-full rounded-full bg-brand" style={{ width: "94.2%" }} />
              </div>
            </div>
          </div>

          {/* Cell 3: Scan Simulation Box (Col span 1) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/40 bg-card p-6 shadow-xs group">
            <div>
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/15 border-transparent">
                <Terminal data-icon="inline-start" />
                核销端模拟器
              </Badge>
              <h3 className="text-lg font-bold text-foreground mt-3">核销与状态控制</h3>
              <p className="text-xs text-muted-foreground">
                在此模拟主办方核销门票的操作，改变上方电子门票的状态。
              </p>
            </div>

            {/* Simulated actions */}
            <div className="mt-8 flex flex-col gap-2">
              <Button
                onClick={triggerScan}
                disabled={ticketStatus !== "UNUSED" || isScanning}
                className={cn(
                  "w-full h-9 rounded-xl text-xs font-semibold transition-all gap-1.5",
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
                  className="flex-1 h-9 rounded-xl text-[11px] font-semibold border-border/50 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
                >
                  模拟用户退票
                </Button>
                <Button
                  onClick={resetTicket}
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-border/50 text-muted-foreground hover:text-foreground"
                  title="重置门票"
                >
                  <RefreshCw />
                </Button>
              </div>
            </div>
          </div>

          {/* Cell 4: Notifications (Col span 2) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/40 bg-card p-6 shadow-xs md:col-span-2 group">
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="bg-zinc-500/10 text-muted-foreground hover:bg-zinc-500/15 border-transparent">
                <Clock data-icon="inline-start" />
                实时动态通知
              </Badge>
              <h3 className="text-lg font-bold text-foreground mt-3">通知与事件流水</h3>
              <p className="text-xs text-muted-foreground">
                模拟实时变化的系统日志。每当有活动审核、门票预订或入场核销，这里会动态增加流水。
              </p>
            </div>

            {/* Dynamic notifications log */}
            <div className="mt-6 flex flex-col gap-2.5 max-h-[140px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {notifications.slice(0, 3).map((note, index) => (
                  <motion.div
                    key={note + index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2.5 text-[11px] text-muted-foreground/90 bg-muted/30 p-2.5 rounded-xl border border-border/20"
                  >
                    <AlertCircle className="size-3.5 mt-0.5 text-brand/70 shrink-0" />
                    <span>{note}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EVENT DISCOVERY SECTION */}
      <section id="events-catalog" className="mx-auto max-w-7xl px-6 py-16 border-t border-border/30">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            活动探索大厅
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground">
            筛选你最感兴趣的校园活动分类，一键获取详细日程并在线预约电子票。
          </p>
        </div>

        {/* Apple-style Segmented Control */}
        <ToggleGroup
          value={[selectedCategory]}
          onValueChange={(val) => {
            if (val && val.length > 0) {
              setSelectedCategory(val[0]);
            } else {
              setSelectedCategory("");
            }
          }}
          className="mt-8 p-1 rounded-2xl bg-muted/60 border border-border/40 backdrop-blur-xs max-w-fit mx-auto shadow-xs"
        >
          {dbCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <ToggleGroupItem
                key={cat}
                value={cat}
                className={cn(
                  "h-8 rounded-[10px] px-4 text-xs font-medium transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "bg-background text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:bg-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/20"
                )}
              >
                {cat || "全部活动"}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        {/* Event Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((evt, idx) => (
            <EventCard key={evt.id} event={evt} priority={idx < 4} />
          ))}
        </div>
        
        {/* Empty state */}
        {filteredEvents.length === 0 && (
          <div className="mt-16 flex flex-col items-center justify-center text-center">
            <AlertCircle className="size-8 text-muted-foreground/60 animate-pulse" />
            <p className="mt-3 text-xs text-muted-foreground">
              暂未发现符合条件的活动
            </p>
          </div>
        )}
      </section>

      {/* 5. CAMPUS VOICE (Testimonial Quote) */}
      <section className="mx-auto max-w-4xl px-6 py-20 md:py-28 text-center border-t border-border/20">
        <blockquote className="text-lg font-medium text-foreground md:text-xl leading-relaxed italic">
          “通过 EventFlow 电子门票系统，学术讲座的签到核销效率提升了 90%。学生入场井然有序，数据大屏实时反馈，活动组织省时省力。”
        </blockquote>
        <div className="mt-5 flex items-center justify-center gap-3">
          <div className="size-8 rounded-full bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">
            C
          </div>
          <div className="text-left text-xs">
            <span className="font-bold text-foreground block">计算机协会负责人</span>
            <span className="text-muted-foreground">EventFlow 核心主办方</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 bg-muted/10 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 EventFlow. Powered by Next.js & Tailwind CSS.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">控制台入口</Link>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-foreground">服务条款</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

