import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Ticket,
  BadgeCheck,
  RefreshCcw,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchMyEvents, deleteEvent } from "@/store/eventsSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function statusVariant(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "success" as const;
    case "CANCELLED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrganizerEventsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { myItems: events, loading } = useAppSelector((s) => s.events);

  useEffect(() => {
    if (user?.role !== "organizer") return;

    dispatch(fetchMyEvents());

    const intervalId = window.setInterval(() => {
      dispatch(fetchMyEvents());
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [dispatch, user]);

  if (!user || user.role !== "organizer") {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">
          Please{" "}
          <Link to="/account" className="text-primary hover:underline font-medium">
            log in as an organizer
          </Link>{" "}
          to manage events.
        </p>
      </div>
    );
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    dispatch(deleteEvent(id));
  };

  const handleOpenEvent = (id: string) => {
    navigate(`/events/${id}`);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">My Events</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCcw
              className={`h-4 w-4 ${loading && events.length > 0 ? "animate-spin" : ""}`}
            />
            <span>Stats refresh automatically every 10 seconds</span>
          </div>
        </div>

        <Button onClick={() => navigate("/organizer/events/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {loading && events.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground">You haven't created any events yet.</p>
          <Button variant="outline" onClick={() => navigate("/organizer/events/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create your first event
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const price = Number(event.ticketPrice);
          const revenue = Number(event.revenue ?? 0);
          const registeredCount = event.registeredCount ?? 0;
          const checkedInCount = event.checkedInCount ?? 0;

          return (
            <Card
              key={event.id}
              className="flex cursor-pointer flex-col transition-shadow hover:shadow-md"
              onClick={() => handleOpenEvent(event.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenEvent(event.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              {event.coverImageUrl && (
                <div className="overflow-hidden rounded-t-lg">
                  <img
                    src={event.coverImageUrl}
                    alt={event.title}
                    className="h-36 w-full object-cover"
                  />
                </div>
              )}

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-tight">
                    <Link
                      to={`/events/${event.id}`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.title}
                    </Link>
                  </CardTitle>
                  <Badge variant={statusVariant(event.status)} className="shrink-0">
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4 text-sm text-muted-foreground">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(event.dateTime)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.location}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <Ticket className="h-4 w-4" />
                      <span className="font-medium">Registered</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {registeredCount}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">Revenue</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      ${revenue.toFixed(2)}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <BadgeCheck className="h-4 w-4" />
                      <span className="font-medium">Checked In</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {checkedInCount}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Capacity {event.capacity}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {price === 0 ? "Free event" : `Ticket $${price.toFixed(2)}`}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="gap-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/organizer/events/${event.id}/edit`);
                  }}
                  className="flex-1"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(event.id, event.title);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}