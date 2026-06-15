"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";

const categories = [
  { label: "学术讲座", value: "学术讲座" },
  { label: "文体比赛", value: "文体比赛" },
  { label: "社团活动", value: "社团活动" },
];

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface EventType {
  id: string;
  title: string;
  category: string;
  location: string;
  startTime: string;
  capacity?: number;
  bookedCount?: number;
}

interface TicketType {
  id: string;
  status: string;
  ticketCode: string;
  event: EventType;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [createdEvents, setCreatedEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 主办方创建活动表单状态
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [category, setCategory] = useState("学术讲座");
  const [eventMsg, setEventMsg] = useState("");

  // 门票核销码状态
  const [ticketCodeInput, setTicketCodeInput] = useState("");
  const [checkinMsg, setCheckinMsg] = useState("");

  const loadDashboardData = async (currUser: User) => {
    try {
      if (currUser.role === "USER") {
        const res = await fetch(`/api/tickets?userId=${currUser.id}`);
        const data = await res.json();
        setTickets(data);
      } else {
        // 主办方/管理员获取自己发布的活动
        const res = await fetch(`/api/events?organizerId=${currUser.id}`);
        const data = await res.json();
        setCreatedEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("campus_user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    const curr = JSON.parse(stored);
    setTimeout(() => {
      setUser(curr);
      loadDashboardData(curr);
    }, 0);
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEventMsg("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          startTime,
          endTime,
          capacity,
          category,
          organizerId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEventMsg("活动创建并发布成功！");
        // 清空表单
        setTitle("");
        setDescription("");
        setLocation("");
        setStartTime("");
        setEndTime("");
        loadDashboardData(user);
      } else {
        setEventMsg(data.message || "创建失败");
      }
    } catch {
      setEventMsg("接口故障");
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckinMsg("");
    try {
      const res = await fetch("/api/tickets/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketCode: ticketCodeInput }),
      });
      const data = await res.json();
      if (data.success) {
        setCheckinMsg(`核销成功: ${data.detail.userName} 已进入 ${data.detail.eventTitle}`);
        setTicketCodeInput("");
      } else {
        setCheckinMsg(data.message || "核销失败");
      }
    } catch {
      setCheckinMsg("核销接口故障");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!user) return;
    if (!confirm("确定要删除此活动吗？")) return;
    await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    loadDashboardData(user);
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">个人控制台</h1>
          <p className="mt-1 text-sm text-neutral-500">
            欢迎回来，{user.name} ({user.role === "USER" ? "学生" : "主办方"})
          </p>
        </div>
      </div>

      {user.role === "USER" ? (
        /* 学生控制台 - 查看电子票根 */
        <div className="mt-10">
          <h2 className="text-lg font-bold text-neutral-900">我的活动门票</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="relative rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="rounded-full bg-neutral-50 px-2 py-0.5 text-xs text-neutral-500 font-semibold border border-neutral-200">
                      {t.event.category}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        t.status === "UNUSED" ? "text-indigo-600" : "text-neutral-400"
                      }`}
                    >
                      {t.status === "UNUSED" ? "● 待核销" : "● 已使用"}
                    </span>
                  </div>
                  <h3 className="mt-3 font-bold text-neutral-900 line-clamp-1">{t.event.title}</h3>
                  <p className="mt-2 text-xs text-neutral-500">地点: {t.event.location}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    时间: {new Date(t.event.startTime).toLocaleString("zh-CN")}
                  </p>
                </div>

                <div className="mt-6 border-t border-dashed border-neutral-200 pt-4 flex flex-col gap-2 bg-neutral-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <span className="text-[10px] text-neutral-400 font-bold tracking-wider">
                    电子入场密钥 (核销码)
                  </span>
                  <span className="font-mono text-sm font-bold text-neutral-800 select-all">
                    {t.ticketCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {tickets.length === 0 && (
            <p className="mt-8 text-center text-sm text-neutral-400">目前还没有订购任何活动门票</p>
          )}
        </div>
      ) : (
        /* 主办方控制台 - 发布活动 & 核销门票 */
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          {/* 左侧：发布活动表单 & 扫码核销 */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            {/* 活动核销 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900">电子门票现场核销</h2>
              <form onSubmit={handleCheckin} className="mt-4 flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="输入门票代码 (e.g. EVT-...)"
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value)}
                  required
                  className="h-10 flex-1 bg-white"
                />
                <Button
                  type="submit"
                  className="h-10 px-4 text-xs font-semibold"
                >
                  一键核销
                </Button>
              </form>
              {checkinMsg && <p className="mt-3 text-xs text-indigo-600 font-semibold">{checkinMsg}</p>}
            </div>

            {/* 创建活动 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-5">发布全新活动</h2>
              <form onSubmit={handleCreateEvent}>
                <FieldGroup>
                  <Field>
                    <FieldLabel>活动名称</FieldLabel>
                    <Input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="bg-white"
                    />
                  </Field>

                  <Field>
                    <FieldLabel>活动分类</FieldLabel>
                    <Select
                      value={category}
                      onValueChange={(val) => setCategory(val || "")}
                      items={categories}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>活动描述</FieldLabel>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                      className="bg-white"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>开始时间</FieldLabel>
                      <Input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="bg-white"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>地点</FieldLabel>
                      <Input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        className="bg-white"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>名额上限 (张)</FieldLabel>
                      <Input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        required
                        className="bg-white"
                      />
                    </Field>
                  </div>

                  {eventMsg && <p className="text-xs text-indigo-600 font-semibold">{eventMsg}</p>}

                  <Button
                    type="submit"
                    className="w-full h-10 font-semibold"
                  >
                    <Plus data-icon="inline-start" />
                    确认发布活动
                  </Button>
                </FieldGroup>
              </form>
            </div>
          </div>

          {/* 右侧：我发布的活动列表 */}
          <div className="lg:col-span-7 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-neutral-900">我发布的活动管理</h2>
            <div className="mt-6 divide-y divide-neutral-100">
              {createdEvents.map((evt) => (
                <div key={evt.id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-800">{evt.title}</h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      地点: {evt.location} | 容量: {evt.capacity} 人 | 已售: {evt.bookedCount} 张
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="hover:border-red-200 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {createdEvents.length === 0 && (
                <p className="py-8 text-center text-xs text-neutral-400">目前未发布任何活动</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
