import { test } from "node:test"
import assert from "node:assert"
import {
  calculateMetrics,
  getCategoryDistribution
} from "../lib/analytics-utils"

const dummyEvents = [
  { id: "1", title: "学术沙龙", capacity: 10, price: 0, location: "一教", category: "学术讲座", startTime: "2026-06-16T10:00:00Z", soldCount: 8, checkedInCount: 4 }
]

const dummyTickets = [
  { id: "t1", ticketCode: "TC1", eventTitle: "学术沙龙", userName: "A", userEmail: "a@test.com", status: "USED", bookedAt: "2026-06-16T08:00:00Z", updatedAt: "2026-06-16T09:00:00Z" },
  { id: "t2", ticketCode: "TC2", eventTitle: "学术沙龙", userName: "B", userEmail: "b@test.com", status: "UNUSED", bookedAt: "2026-06-16T08:05:00Z", updatedAt: "2026-06-16T08:05:00Z" },
  { id: "t3", ticketCode: "TC3", eventTitle: "学术沙龙", userName: "C", userEmail: "c@test.com", status: "CANCELLED", bookedAt: "2026-06-16T08:10:00Z", updatedAt: "2026-06-16T08:10:00Z" }
]

test("calculateMetrics: 正确计算百分比与总量", () => {
  const metrics = calculateMetrics(dummyEvents, dummyTickets)
  assert.strictEqual(metrics.totalEvents, 1)
  assert.strictEqual(metrics.totalBooked, 2) // 排除已取消的
  assert.strictEqual(metrics.checkedInCount, 1)
  assert.strictEqual(metrics.checkinRate, 50.0) // 1 / 2 * 100
})

test("calculateMetrics: 空数据安全保护", () => {
  const metrics = calculateMetrics([], [])
  assert.strictEqual(metrics.totalEvents, 0)
  assert.strictEqual(metrics.totalBooked, 0)
  assert.strictEqual(metrics.checkedInCount, 0)
  assert.strictEqual(metrics.checkinRate, 0)
})

test("getCategoryDistribution: 正确聚合类别数量", () => {
  const dist = getCategoryDistribution(dummyEvents)
  const lecture = dist.find(d => d.category === "学术讲座")
  assert.ok(lecture)
  assert.strictEqual(lecture.count, 1)
})

test("getCategoryDistribution: 能够动态统计新增的分类数量", () => {
  const customEvents = [
    ...dummyEvents,
    { id: "2", title: "志愿活动", capacity: 20, price: 0, location: "图书馆", category: "志愿服务", startTime: "2026-06-16T10:00:00Z", soldCount: 5, checkedInCount: 2 }
  ]
  const dist = getCategoryDistribution(customEvents)
  const volunteer = dist.find(d => d.category === "志愿服务")
  assert.ok(volunteer)
  assert.strictEqual(volunteer.count, 1)
})
