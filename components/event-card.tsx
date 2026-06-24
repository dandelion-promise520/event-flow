import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

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
  priority?: boolean;
}

export default function EventCard({ event, priority = false }: EventProps) {
  const percent = Math.min(100, Math.floor((event.bookedCount / event.capacity) * 100));
  const dateStr = new Date(event.startTime).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-border/80 hover:shadow-lg">
      <div className="aspect-video w-full bg-muted overflow-hidden relative">
        {event.coverUrl ? (
          <Image
            src={event.coverUrl}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
      <CardHeader className="px-5 pt-5 pb-0">
        <CardTitle className="text-foreground group-hover:text-brand transition-colors line-clamp-1">
          {event.title}
        </CardTitle>
        <CardDescription className="mt-2 text-xs text-muted-foreground line-clamp-2">
          {event.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 px-5 pt-4 pb-0 flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground/80" />
            <span>{dateStr}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-muted-foreground/80" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
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
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 border-t-0 bg-transparent">
        <Button
          render={<Link href={`/events/${event.id}`} />}
          variant="outline"
          nativeButton={false}
          className="mt-5 text-xs font-semibold w-full"
        >
          查看详情与预订
        </Button>
      </CardFooter>
    </Card>
  );
}
