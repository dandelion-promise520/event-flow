"use client";

import { useEffect, useState, use, useCallback } from "react";
import { MapPin, Calendar, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

import { EventItem } from "@/components/event-card";
import ReviewSection from "@/components/review-section";

export default function EventDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [booking, setBooking] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events`);
      const data = await res.json();
      const current = data.find((e: EventItem) => e.id === id);
      setEvent(current);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvent();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEvent]);

  const handleBook = async () => {
    if (!event) return;
    const stored = localStorage.getItem("campus_user");
    if (!stored) {
      window.location.href = "/login";
      return;
    }
    const user = JSON.parse(stored);
    setBooking(true);
    setMessage("");

    try {
      const res = await fetch(`/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, eventId: event.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setMessage(`订票成功！专属核销码: ${data.ticket.ticketCode}`);
        fetchEvent();
      } else {
        setMessage(data.message || "订票失败，请重试");
      }
    } catch {
      setMessage("服务器异常，订票失败");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-7xl p-12 text-center text-neutral-500">
        未找到该活动信息。
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-black mb-8">
        <ArrowLeft className="h-4 w-4" />
        返回大厅
      </Link>

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        {event.coverUrl && (
          <div className="aspect-[2.39/1] w-full bg-neutral-100 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.coverUrl} alt={event.title} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="p-8">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
            {event.category}
          </span>
          <h1 className="mt-4 text-2xl md:text-3xl font-extrabold text-neutral-900">{event.title}</h1>
          
          <div className="mt-6 grid gap-4 border-y border-neutral-100 py-6 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500 border border-neutral-150">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-semibold">开始时间</p>
                <p className="text-sm font-bold text-neutral-800">{new Date(event.startTime).toLocaleString("zh-CN")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500 border border-neutral-150">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-400 font-semibold">活动地点</p>
                <p className="text-sm font-bold text-neutral-800">{event.location}</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-neutral-900">活动介绍</h2>
            <p className="mt-3 text-neutral-600 text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          <div className="mt-10 rounded-2xl bg-neutral-50 border border-neutral-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs text-neutral-500">剩余容量</p>
              <p className="text-lg font-extrabold text-neutral-900">
                {event.capacity - event.bookedCount} / {event.capacity} 人
              </p>
            </div>

            <div className="flex flex-col gap-2 min-w-[200px]">
              {success ? (
                <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>预约成功</span>
                </div>
              ) : (
                <Button
                  disabled={event.bookedCount >= event.capacity || booking}
                  onClick={handleBook}
                  className="w-full h-11 font-semibold"
                >
                  {booking ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : null}
                  {booking ? "正在预订..." : "立即预订电子门票"}
                </Button>
              )}
              {message && (
                <p className={`text-xs ${success ? "text-emerald-600" : "text-red-500"} mt-2`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReviewSection eventId={id} />
    </div>
  );
}
