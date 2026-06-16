/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:shadow-lg">
      <div className="aspect-video w-full bg-muted overflow-hidden relative">
        {event.coverUrl ? (
          <img
            src={event.coverUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground font-semibold">
            {event.category}
          </div>
        )}
        <Badge className="absolute left-3 top-3 bg-popover/95 text-foreground/90 shadow-sm">
          {event.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold text-foreground group-hover:text-brand line-clamp-1 transition-colors">
          {event.title}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{event.description}</p>
        
        <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground/80" />
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-muted-foreground/80" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              <span>容量: {event.capacity}人</span>
            </span>
            <span>已订: {event.bookedCount}张</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
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
