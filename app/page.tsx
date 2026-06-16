"use client"

import { useEffect, useState, useCallback } from "react"
import EventCard, { EventItem } from "@/components/event-card"
import { Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [keyword, setKeyword] = useState<string>("")

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

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-linear-to-tr from-brand/5 via-background to-pink-500/5 dark:from-brand/10 dark:via-card dark:to-pink-500/5 py-12 text-center md:py-20">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          <Sparkles className="h-3 w-3" />
          全新上线校园活动大厅
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
          精彩校园活动，一指即达
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
          极速报名你感兴趣的学术讲座、文体比赛与社团桌游。电子门票自动生成，入场模拟一键扫码核销。
        </p>

        {/* Search Bar */}
        <div className="relative mx-auto mt-8 flex max-w-md items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="搜索感兴趣的活动..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-11 w-full rounded-full border border-border pr-4 pl-10 text-sm shadow-sm transition-all outline-none focus:border-brand/50 bg-background text-foreground"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
        {["", "学术讲座", "文体比赛", "社团活动"].map((cat) => (
          <Button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            variant={selectedCategory === cat ? "default" : "outline"}
            className="h-9 rounded-xl px-4 text-sm font-semibold"
          >
            {cat || "全部活动"}
          </Button>
        ))}
      </div>

      {/* Event Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((evt) => (
          <EventCard key={evt.id} event={evt} />
        ))}
      </div>
      {filteredEvents.length === 0 && (
        <div className="mt-16 text-center text-sm text-muted-foreground">
          暂未发现符合条件的活动
        </div>
      )}
    </div>
  )
}
