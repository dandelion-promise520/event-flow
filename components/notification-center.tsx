"use client";

import { useEffect, useState } from "react";
import { Bell, Check, AlertCircle } from "lucide-react";
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
            className="group relative rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-200"
          >
            <Bell className="size-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-destructive ring-1.5 ring-background" />
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
                className="p-3.5 text-xs transition-colors hover:bg-muted/40 relative bg-card"
              >
                <div className="flex gap-3 items-start">
                  {n.title.includes("核销") || n.title.includes("成功") ? (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-4" />
                    </div>
                  ) : (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="size-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs truncate ${n.isRead ? "text-muted-foreground font-normal" : "text-foreground font-semibold"}`}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="size-1.5 rounded-full bg-brand shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 shrink-0 font-medium">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed break-words ${n.isRead ? "text-muted-foreground/80" : "text-foreground/80"}`}>
                      {n.content}
                    </p>
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
