import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, ImagePlus, X, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  createEvent,
  updateEvent,
  fetchEventById,
  clearCurrentEvent,
} from "@/store/eventsSlice";
import { parseApiError, uploadFile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function toLocalDateTimeValue(iso: string) {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function EventFormPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const isEdit = Boolean(eventId);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const currentEvent = useAppSelector((s) => s.events.current);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "CANCELLED">("DRAFT");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && eventId) {
      dispatch(fetchEventById(eventId));
    }
    return () => {
      dispatch(clearCurrentEvent());
    };
  }, [dispatch, isEdit, eventId]);

  useEffect(() => {
    if (isEdit && currentEvent && !loaded) {
      setTitle(currentEvent.title);
      setDescription(currentEvent.description);
      setLocation(currentEvent.location);
      setDateTime(toLocalDateTimeValue(currentEvent.dateTime));
      setCapacity(String(currentEvent.capacity));
      setTicketPrice(String(currentEvent.ticketPrice));
      setStatus(currentEvent.status);
      setCoverImageUrl(currentEvent.coverImageUrl ?? null);
      setLoaded(true);
    }
  }, [isEdit, currentEvent, loaded]);

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

  if (isEdit && currentEvent && currentEvent.organizerId !== user.id) {
    return (
      <div className="container py-12 text-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          You can only edit events you created.
        </div>
      </div>
    );
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setError(null);
    try {
      const result = await uploadFile("/upload/event-cover", file);
      setCoverImageUrl(result.coverImageUrl);
    } catch (err: any) {
      setError(parseApiError(err));
    }
    setCoverUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, any> = {
      title,
      description,
      location,
      dateTime: new Date(dateTime).toISOString(),
      capacity: Number(capacity),
      ticketPrice: Number(ticketPrice),
      status,
    };
    if (coverImageUrl !== undefined) payload.coverImageUrl = coverImageUrl;

    try {
      if (isEdit && eventId) {
        const result = await dispatch(updateEvent({ id: eventId, ...payload }));
        if (updateEvent.rejected.match(result)) {
          setError(result.payload as string);
          setSubmitting(false);
          return;
        }
      } else {
        const result = await dispatch(createEvent(payload));
        if (createEvent.rejected.match(result)) {
          setError(result.payload as string);
          setSubmitting(false);
          return;
        }
      }
      navigate("/organizer/events");
    } catch (err: any) {
      setError(parseApiError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <Link
        to="/organizer/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to my events
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Edit Event" : "Create New Event"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              {coverImageUrl ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={coverImageUrl}
                    alt="Cover preview"
                    className="w-full h-44 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl(null)}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={coverUploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {coverUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                  {coverUploading ? "Uploading..." : "Click to upload a cover image"}
                </button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Tech Meetup 2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event..."
                required
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Room 101, Engineering Building"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTime">Date & Time *</Label>
                <Input
                  id="dateTime"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketPrice">Ticket Price ($) *</Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
                {submitting
                  ? isEdit
                    ? "Saving..."
                    : "Creating..."
                  : isEdit
                    ? "Save Changes"
                    : "Create Event"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/organizer/events")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
