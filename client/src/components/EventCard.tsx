import { Link } from "react-router-dom";
import { MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types";

interface EventCardProps {
  event: Event;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function statusVariant(status: Event["status"]) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="group flex gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
    >
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Calendar className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
            {event.title}
          </h3>
          <Badge variant={statusVariant(event.status)} className="shrink-0">
            {event.status}
          </Badge>
        </div>

        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(event.dateTime)} &middot; {formatTime(event.dateTime)}
        </p>

        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-red-500" />
          {event.location}
        </p>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {event.description}
        </p>
      </div>
    </Link>
  );
}