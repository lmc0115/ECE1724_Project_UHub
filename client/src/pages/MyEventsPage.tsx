import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, Ticket, AlertCircle, QrCode, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchMyRegistrations, cancelRegistration } from "@/store/registrationsSlice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function paymentVariant(status: string) {
  switch (status) {
    case "PAID":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "REFUNDED":
      return "secondary" as const;
    default:
      return "destructive" as const;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MyEventsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { items: registrations, loading, error } = useAppSelector(
    (s) => s.registrations
  );
  const [expandedQr, setExpandedQr] = useState<string | null>(null);

  useEffect(() => {
    if (user) dispatch(fetchMyRegistrations());
  }, [dispatch, user]);

  if (!user) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Login Required</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in to view your registered events.
          </p>
          <Link to="/account">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground mt-1">
          Events you've registered for
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && registrations.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            You haven't registered for any events yet.
          </p>
          <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">
            Browse events
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {registrations.map((reg) => (
          <Card key={reg.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">
                  {reg.event ? (
                    <Link
                      to={`/events/${reg.eventId}`}
                      className="hover:text-primary transition-colors"
                    >
                      {reg.event.title}
                    </Link>
                  ) : (
                    `Event ${reg.eventId.slice(0, 8)}...`
                  )}
                </CardTitle>
                <Badge variant={paymentVariant(reg.paymentStatus)}>
                  {reg.paymentStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {reg.event && (
                <>
                  <p className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(reg.event.dateTime)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {reg.event.location}
                  </p>
                </>
              )}
              <p className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5" />
                Registered {formatDate(reg.registrationDate)}
              </p>

              {reg.ticket && (
                <div className="pt-2">
                  {reg.ticket.redemptionStatus === "REDEEMED" ? (
                    <Badge variant="success">Checked In</Badge>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedQr(expandedQr === reg.id ? null : reg.id)
                        }
                      >
                        <QrCode className="h-3.5 w-3.5 mr-1.5" />
                        {expandedQr === reg.id ? "Hide QR" : "Show QR Code"}
                      </Button>

                      {expandedQr === reg.id && (
                        <div className="flex flex-col items-center gap-2 mt-3 p-4 bg-white rounded-lg border">
                          <QRCodeSVG
                            value={reg.ticket.qrCodeData}
                            size={160}
                            level="H"
                            includeMargin
                          />
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {reg.ticket.qrCodeData}
                          </p>
                          <p className="text-xs text-muted-foreground text-center">
                            Present this at the event entrance
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              {reg.ticket?.redemptionStatus !== "REDEEMED" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => dispatch(cancelRegistration(reg.id))}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Cancel Registration
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
