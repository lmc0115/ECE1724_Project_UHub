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
    if (user?.role === "organizer") {
      dispatch(fetchMyEvents());
    }
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

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Events</h1>
        <Button onClick={() => navigate("/organizer/events/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {loading && (
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
          return (
            <Card key={event.id} className="flex flex-col">
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
                    >
                      {event.title}
                    </Link>
                  </CardTitle>
                  <Badge variant={statusVariant(event.status)} className="shrink-0">
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(event.dateTime)}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.location}
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {event.capacity}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="gap-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/organizer/events/${event.id}/edit`)}
                  className="flex-1"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(event.id, event.title)}
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
