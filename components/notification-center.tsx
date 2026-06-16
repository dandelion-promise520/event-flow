"use client";

import { useEffect, useState } from "react";
import { Bell, Check, MailOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
      let interval: NodeJS.Timeout | undefined;
      const timer = setTimeout(() => {
        setUser(u);
        fetchNotifications(u.id);
        // 轮询（每10秒自动更新一次通知列表）
        interval = setInterval(() => fetchNotifications(u.id), 10000);
      }, 0);
      return () => {
        clearTimeout(timer);
        if (interval) clearInterval(interval);
      };
    }
  }, []);

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full size-2.5 bg-destructive" />
              </span>
            )}
          </Button>
        }
      />

      <PopoverContent align="end" className="w-80 p-0 overflow-hidden">
        <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/50">
          <span className="font-semibold text-sm text-foreground/90">站内通知</span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-brand hover:text-brand/80 transition-colors hover:underline flex items-center gap-1 font-medium"
            >
              <Check className="size-3.5" /> 全部标为已读
            </button>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">暂无消息</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 text-xs transition-colors ${
                  n.isRead ? "bg-card hover:bg-muted/30" : "bg-brand/10 hover:bg-brand/15 font-medium"
                }`}
              >
                <div className="flex gap-2.5 items-start">
                  {n.title.includes("核销") || n.title.includes("成功") ? (
                    <MailOpen className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="text-foreground font-semibold truncate">{n.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed break-words">{n.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
