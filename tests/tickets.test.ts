import assert from "node:assert";
import test from "node:test";
import { prisma } from "../lib/db";

test("Ticket Booking and Check-in flow", async () => {
  // 基础数据准备
  let student = await prisma.user.findFirst({ where: { role: "USER" } });
  if (!student) student = await prisma.user.create({ data: { email: "stu@campus.com", name: "Student", password: "123" } });

  let organizer = await prisma.user.findFirst({ where: { role: "ORGANIZER" } });
  if (!organizer) organizer = await prisma.user.create({ data: { email: "org2@campus.com", name: "Org2", password: "123", role: "ORGANIZER" } });

  const event = await prisma.event.create({
    data: {
      title: "Fast Booking",
      description: "Rapid desc",
      location: "Hall A",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600 * 1000),
      capacity: 10,
      category: "Sports",
      organizerId: organizer.id
    }
  });

  // 1. 订票
  const code = `EVT-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const ticket = await prisma.ticket.create({
    data: {
      ticketCode: code,
      userId: student.id,
      eventId: event.id
    }
  });

  assert.strictEqual(ticket.status, "UNUSED");

  // 2. 核销
  const updated = await prisma.ticket.update({
    where: { ticketCode: code },
    data: { status: "USED" }
  });

  assert.strictEqual(updated.status, "USED");

  // 清理
  await prisma.event.delete({ where: { id: event.id } });
});
