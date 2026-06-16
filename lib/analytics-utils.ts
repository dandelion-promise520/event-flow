import { format, subDays } from "date-fns"

export interface EventData {
  id: string
  title: string
  capacity: number
  price: number
  location: string
  category: string
  startTime: string
  soldCount: number
  checkedInCount: number
}

export interface TicketData {
  id: string
  ticketCode: string
  eventTitle: string
  userName: string
  userEmail: string
  status: string
  bookedAt: string
  updatedAt: string
}

export function calculateMetrics(events: EventData[], tickets: TicketData[]) {
  const activeTickets = tickets.filter(t => t.status !== "CANCELLED")
  const checkedInCount = tickets.filter(t => t.status === "USED").length
  const totalBooked = activeTickets.length
  const checkinRate = totalBooked > 0 ? (checkedInCount / totalBooked) * 100 : 0

  return {
    totalEvents: events.length,
    totalBooked,
    checkedInCount,
    checkinRate: parseFloat(checkinRate.toFixed(1))
  }
}

export function getRecent7DaysTrends(tickets: TicketData[]) {
  const activeTickets = tickets.filter(t => t.status !== "CANCELLED")
  const trendsMap = new Map<string, number>()

  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i)
    const dateStr = format(d, "MM-dd")
    trendsMap.set(dateStr, 0)
  }

  activeTickets.forEach(t => {
    const dateStr = format(new Date(t.bookedAt), "MM-dd")
    if (trendsMap.has(dateStr)) {
      trendsMap.set(dateStr, trendsMap.get(dateStr)! + 1)
    }
  })

  return Array.from(trendsMap.entries()).map(([date, count]) => ({
    date,
    count
  }))
}

export function getCategoryDistribution(events: EventData[]) {
  const dist: Record<string, number> = {
    "学术讲座": 0,
    "文体比赛": 0,
    "社团活动": 0
  }

  events.forEach(e => {
    if (dist[e.category] !== undefined) {
      dist[e.category]++
    }
  })

  return Object.entries(dist).map(([category, count]) => ({
    category,
    count
  }))
}

export function getEventBookingRates(events: EventData[]) {
  return events.slice(0, 8).map(e => ({
    title: e.title.length > 8 ? e.title.slice(0, 8) + "..." : e.title,
    booked: e.soldCount,
    capacity: e.capacity
  }))
}
