"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, MailOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("campus_user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      fetchNotifications(u.id);
      
      // 轮询（每10秒自动更新一次通知列表）
      const interval = setInterval(() => fetchNotifications(u.id), 10000);
      return () => clearInterval(interval);
    }
  }, []);

  // 点击外部关闭弹窗
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative rounded-full hover:bg-muted/80 text-neutral-600 hover:text-black transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-xl border border-[#e4e4e7] shadow-xl z-50 overflow-hidden bg-white dark:bg-zinc-950 animate-in fade-in-50 slide-in-from-top-1 duration-200">
          <div className="p-3.5 border-b border-[#e4e4e7] flex items-center justify-between bg-neutral-50/50">
            <span className="font-semibold text-sm text-neutral-800">站内通知</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors hover:underline flex items-center gap-1 font-medium"
              >
                <Check className="h-3.5 w-3.5" /> 全部标为已读
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#f4f4f5]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">暂无消息</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-xs transition-colors ${
                    n.isRead ? "bg-white hover:bg-neutral-50/30" : "bg-indigo-50/40 hover:bg-indigo-50/60 font-medium"
                  }`}
                >
                  <div className="flex gap-2.5 items-start">
                    {n.title.includes("核销") || n.title.includes("成功") ? (
                      <MailOpen className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1 mb-1">
                        <span className="text-neutral-900 font-semibold truncate">{n.title}</span>
                        <span className="text-[10px] text-neutral-400 shrink-0 mt-0.5">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-neutral-500 leading-relaxed break-words">{n.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
