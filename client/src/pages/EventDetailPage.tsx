import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Tag,
  CheckCircle2,
  QrCode,
  X,
  Download,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchEventById, clearCurrentEvent } from "@/store/eventsSlice";
import { registerForEvent, fetchMyRegistrations } from "@/store/registrationsSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LiveChatCard } from "@/components/LiveChatCard";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function getFilenameFromDisposition(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (basicMatch?.[1]) {
    return basicMatch[1];
  }

  return fallback;
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const dispatch = useAppDispatch();
  const { current: event, loading, error } = useAppSelector((s) => s.events);
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  const registrations = useAppSelector((s) => s.registrations.items);

  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const myRegistration = registrations.find((r) => r.eventId === eventId);

  useEffect(() => {
    if (eventId) dispatch(fetchEventById(eventId));
    if (user && user.role === "student") dispatch(fetchMyRegistrations());

    let intervalId: number | undefined;

    if (eventId && user?.role === "organizer") {
      intervalId = window.setInterval(() => {
        dispatch(fetchEventById(eventId));
      }, 10000);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      dispatch(clearCurrentEvent());
    };
  }, [dispatch, eventId, user]);

  const handleRegister = async () => {
    if (!eventId) return;

    if (event && Number(event.ticketPrice) > 0 && !showPayment) {
      setShowPayment(true);
      return;
    }

    setRegistering(true);
    setRegError(null);
    const result = await dispatch(registerForEvent(eventId));
    setRegistering(false);
    setShowPayment(false);

    if (registerForEvent.rejected.match(result)) {
      setRegError(result.payload as string);
    }
  };

  const handleExportCsv = async () => {
    if (!eventId || !token) return;

    setExportingCsv(true);
    setExportError(null);

    try {
      const response = await fetch(`/api/events/${eventId}/export-attendees`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = "Failed to export CSV.";
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {
          // ignore json parse failure
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const fallbackName = `event-${eventId}-attendees.csv`;
      const filename = getFilenameFromDisposition(
        response.headers.get("content-disposition"),
        fallbackName
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || "Failed to export CSV.");
    } finally {
      setExportingCsv(false);
    }
  };

  if (loading && !event) {
    return (
      <div className="container flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  if (!event) return null;

  const price = Number(event.ticketPrice);
  const isFree = price === 0;
  const isOwnerOrganizer = user?.role === "organizer" && user.id === event.organizerId;
  const registeredCount = event.registeredCount ?? 0;
  const checkedInCount = event.checkedInCount ?? 0;
  const revenue = Number(event.revenue ?? 0);

  const liveChatEnabled =
    isOwnerOrganizer || (user?.role === "student" && !!myRegistration);

  const liveChatDisabledMessage = !user
    ? "Log in to join the live event chat."
    : user.role === "student" && !myRegistration
      ? "Register for this event to join the live chat."
      : user.role === "staff"
        ? "Live chat is currently available for organizers and registered students only."
        : "You do not have access to this live chat.";

  return (
    <div className="container py-6 space-y-6 max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      {event.coverImageUrl && (
        <div
          className="overflow-hidden rounded-xl cursor-pointer"
          onClick={() => setShowImagePreview(true)}
        >
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {showImagePreview && event.coverImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative max-w-3xl w-full mx-4">
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-10 right-0 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          <Badge variant={statusVariant(event.status)} className="shrink-0 mt-1">
            {event.status}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{formatDateTime(event.dateTime)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{event.location}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4" /> Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{event.capacity} spots</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {isFree ? "Free" : `$${price.toFixed(2)}`}
              </p>
            </CardContent>
          </Card>
        </div>

        {event.organizer && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tag className="h-4 w-4" />
            Organized by{" "}
            <span className="font-medium text-foreground">
              {event.organizer.organizationName || event.organizer.name}
            </span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>About this event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {event.description}
            </p>
          </CardContent>
        </Card>

        {isOwnerOrganizer && (
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Organizer Statistics</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={exportingCsv}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportingCsv ? "Exporting..." : "Export Attendees CSV"}
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Registered
                  </div>
                  <p className="mt-3 text-3xl font-bold text-foreground">
                    {registeredCount}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    Revenue
                  </div>
                  <p className="mt-3 text-3xl font-bold text-foreground">
                    ${revenue.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Checked In
                  </div>
                  <p className="mt-3 text-3xl font-bold text-foreground">
                    {checkedInCount}
                  </p>
                </div>
              </div>

              {exportError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {exportError}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registration section for students */}
        {user?.role === "student" && event.status === "PUBLISHED" && (
          <Card>
            <CardContent className="pt-6">
              {myRegistration ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">You're registered for this event!</span>
                  </div>

                  {myRegistration.ticket && (
                    <>
                      <Button
                        variant={showQr ? "secondary" : "default"}
                        onClick={() => setShowQr(!showQr)}
                        className="w-full sm:w-auto"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {showQr ? "Hide QR Code" : "Show QR Code for Check-in"}
                      </Button>

                      {showQr && (
                        <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-xl border shadow-sm">
                          <QRCodeSVG
                            value={myRegistration.ticket.qrCodeData}
                            size={200}
                            level="H"
                            includeMargin
                          />
                          <p className="text-xs text-muted-foreground font-mono">
                            {myRegistration.ticket.qrCodeData}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Show this QR code to staff at the event entrance
                          </p>
                          {myRegistration.ticket.redemptionStatus === "REDEEMED" && (
                            <Badge variant="success">Already Checked In</Badge>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {showPayment && !isFree ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border bg-muted/50 p-4">
                        <p className="font-medium mb-1">Payment Summary</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{event.title}</span>
                          <span className="font-semibold">${price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleRegister} disabled={registering} className="flex-1">
                          {registering ? "Processing..." : `Pay $${price.toFixed(2)} & Register`}
                        </Button>
                        <Button variant="outline" onClick={() => setShowPayment(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="lg" className="w-full sm:w-auto" onClick={handleRegister} disabled={registering}>
                      {registering
                        ? "Registering..."
                        : isFree
                          ? "Register Now"
                          : `Register Now — $${price.toFixed(2)}`}
                    </Button>
                  )}

                  {regError && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                      {regError}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!user && event.status === "PUBLISHED" && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <Link to="/account" className="text-primary hover:underline font-medium">
                  Log in as a student
                </Link>{" "}
                to register for this event.
              </p>
            </CardContent>
          </Card>
        )}

        <LiveChatCard
          eventId={event.id}
          currentUserId={user?.id}
          enabled={liveChatEnabled}
          disabledMessage={liveChatDisabledMessage}
        />
      </div>
    </div>
  );
}