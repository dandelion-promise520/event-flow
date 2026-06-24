"use client"

import { useEffect, useState, useCallback } from "react"
import EventCard, { EventItem } from "@/components/event-card"
import { Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [keyword, setKeyword] = useState<string>("")
  const [dbCategories, setDbCategories] = useState<string[]>(["", "学术讲座", "文体比赛", "社团活动"])

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch("/api/categories")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setDbCategories(["", ...data.map((c: any) => c.name)])
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

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-linear-to-b from-card to-background dark:from-card/50 dark:to-background py-12 text-center md:py-20 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none">
        <Badge className="gap-1 bg-brand/10 text-brand hover:bg-brand/15 border-transparent font-medium py-1 px-3 rounded-full text-xs">
          <Sparkles className="size-3" />
          全新上线校园活动大厅
        </Badge>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground md:text-5xl letter-tight">
          精彩校园活动，一指即达
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-xs text-muted-foreground/80 md:text-sm leading-relaxed">
          极速报名你感兴趣的学术讲座、文体比赛与社团桌游。电子门票自动生成，入场模拟一键扫码核销。
        </p>

        {/* Spotlight-like Search Bar */}
        <div className="relative mx-auto mt-8 flex max-w-md items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground/80" />
          <Input
            type="text"
            placeholder="搜索感兴趣的活动..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border/60 pr-4 pl-10 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 outline-none focus:border-brand/40 bg-muted/40 focus:bg-background text-foreground"
          />
        </div>
      </div>

      {/* Apple-style Segmented Control */}
      <div className="mt-12 p-1 rounded-2xl bg-muted/50 border border-border/40 backdrop-blur-xs max-w-fit mx-auto flex gap-0.5 items-center shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        {dbCategories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <Button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              variant="ghost"
              className={cn(
                "h-8 rounded-[10px] px-4 text-xs font-medium transition-all duration-200",
                isSelected
                  ? "bg-background text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/20"
              )}
            >
              {cat || "全部活动"}
            </Button>
          );
        })}
      </div>

      {/* Event Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((evt, idx) => (
          <EventCard key={evt.id} event={evt} priority={idx < 4} />
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
