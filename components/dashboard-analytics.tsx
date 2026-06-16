"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart"
import {
  calculateMetrics,
  getRecent7DaysTrends,
  getCategoryDistribution,
  getEventBookingRates,
  type EventData,
  type TicketData
} from "@/lib/analytics-utils"
import { Calendar, Ticket, CheckCircle, Percent } from "lucide-react"

interface DashboardAnalyticsProps {
  events: EventData[]
  tickets: TicketData[]
}

const chartConfig = {
  booked: {
    label: "已报名人数",
    color: "hsl(var(--chart-1))",
  },
  capacity: {
    label: "活动总容量",
    color: "hsl(var(--chart-2))",
  },
  count: {
    label: "单日订票数",
    color: "hsl(var(--chart-1))",
  },
  "学术讲座": {
    label: "学术讲座",
    color: "hsl(var(--chart-1))",
  },
  "文体比赛": {
    label: "文体比赛",
    color: "hsl(var(--chart-2))",
  },
  "社团活动": {
    label: "社团活动",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export default function DashboardAnalytics({
  events,
  tickets
}: DashboardAnalyticsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const metrics = useMemo(() => calculateMetrics(events, tickets), [events, tickets])
  const trendsData = useMemo(() => getRecent7DaysTrends(tickets), [tickets])
  const categoryData = useMemo(() => getCategoryDistribution(events), [events])
  const bookingRatesData = useMemo(() => getEventBookingRates(events), [events])

  if (!mounted) {
    return <div className="h-64 animate-pulse bg-muted rounded-2xl" />
  }

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* 指标卡片网格 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">已创建活动</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents}</div>
            <p className="text-[10px] text-muted-foreground mt-1">主办方发布的活动总数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">门票预订总量</CardTitle>
            <Ticket className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBooked}</div>
            <p className="text-[10px] text-muted-foreground mt-1">排除已取消订单后的有效票数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">已核销总量</CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.checkedInCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1">已经扫码入场的学生数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">整体核销率</CardTitle>
            <Percent className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.checkinRate}%</div>
            <div className="w-full bg-muted h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-brand h-full transition-all duration-500" 
                style={{ width: `${Math.min(metrics.checkinRate, 100)}%` }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 折线走势与饼图 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">最近 7 日订票量趋势</CardTitle>
            <CardDescription>展示过去一天的票务预订活跃曲线</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={trendsData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">活动分类分布</CardTitle>
            <CardDescription>已发布活动的类别占比统计</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center relative">
            <ChartContainer config={chartConfig} className="h-full w-full max-h-56">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* 柱状对比图 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold">热门活动报名进度对比</CardTitle>
          <CardDescription>对比近 8 个已发布活动的学生预约数与可容纳上限</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={bookingRatesData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="title" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="booked" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={32} name="已报名数" />
              <Bar dataKey="capacity" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} maxBarSize={32} name="总名额" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
