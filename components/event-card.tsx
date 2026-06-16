/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EventItem {
  id: string;
  title: string;
  description: string;
  coverUrl?: string | null;
  location: string;
  startTime: string;
  capacity: number;
  bookedCount: number;
  category: string;
}

interface EventProps {
  event: EventItem;
}

export default function EventCard({ event }: EventProps) {
  const percent = Math.min(100, Math.floor((event.bookedCount / event.capacity) * 100));
  const dateStr = new Date(event.startTime).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg">
      <div className="aspect-video w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
        {event.coverUrl ? (
          <img
            src={event.coverUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400 dark:text-neutral-500 font-semibold">
            {event.category}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 dark:bg-zinc-900/95 px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-250 shadow-sm">
          {event.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1 transition-colors">
          {event.title}
        </h3>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{event.description}</p>
        
        <div className="mt-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <div className="mt-6 space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>容量: {event.capacity}人</span>
            </span>
            <span>已订: {event.bookedCount}张</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <Button
          render={<Link href={`/events/${event.id}`} />}
          variant="outline"
          nativeButton={false}
          className="mt-5 text-xs font-semibold w-full"
        >
          查看详情与预订
        </Button>
      </div>
    </div>
  );
}
