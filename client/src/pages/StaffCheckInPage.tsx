import { useState, useEffect, useRef } from "react";
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  Keyboard,
  User,
  Calendar,
  MapPin,
} from "lucide-react";
import { useAppSelector } from "@/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

interface VerifyResult {
  success: boolean;
  message: string;
  student?: { id: string; name: string; email: string };
  event?: { id: string; title: string; dateTime: string; location: string };
  redeemedAt?: string;
}

export function StaffCheckInPage() {
  const user = useAppSelector((s) => s.auth.user);

  if (!user || user.role !== "staff") {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Staff Access Only</h2>
          <p className="text-muted-foreground mb-4">
            You need to be logged in as staff to access check-in.
          </p>
          <Link to="/account">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <CheckInView />;
}

function CheckInView() {
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [qrInput, setQrInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef(false);

  const safeStop = async (scanner: any) => {
    if (!scanner || !isRunningRef.current) return;
    isRunningRef.current = false;
    try {
      await scanner.stop();
    } catch {
      // already stopped or never fully started
    }
  };

  useEffect(() => {
    if (mode !== "camera") {
      safeStop(scannerRef.current).then(() => {
        scannerRef.current = null;
        setScanning(false);
      });
      return;
    }

    let html5QrCode: any = null;
    let cancelled = false;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled || !scannerContainerRef.current) return;

      html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            handleVerify(decodedText);
            safeStop(html5QrCode).then(() => setScanning(false));
          },
          () => {}
        );
        if (!cancelled) {
          isRunningRef.current = true;
          setScanning(true);
        } else {
          isRunningRef.current = true;
          await safeStop(html5QrCode);
          scannerRef.current = null;
          setScanning(false);
        }
      } catch {
        if (!cancelled) setMode("manual");
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      safeStop(scannerRef.current).then(() => {
        scannerRef.current = null;
        setScanning(false);
      });
    };
  }, [mode]);

  const handleVerify = async (qrCodeData: string) => {
    if (!qrCodeData.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const data = await api.post<any>("/tickets/verify", { qrCodeData: qrCodeData.trim() });
      setResult({
        success: true,
        message: data.message || "Ticket redeemed successfully!",
        student: data.student,
        event: data.event,
      });
    } catch (err: any) {
      let parsed: any = {};
      try {
        parsed = JSON.parse(err.message);
      } catch {
        parsed = { error: err.message };
      }
      setResult({
        success: false,
        message: parsed.error || err.message,
        student: parsed.student,
        event: parsed.event,
        redeemedAt: parsed.redeemedAt,
      });
    }

    setLoading(false);
    setQrInput("");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(qrInput);
  };

  const resetForNext = () => {
    setResult(null);
    if (mode === "camera") {
      setMode("manual");
      setTimeout(() => setMode("camera"), 100);
    }
  };

  return (
    <div className="container py-6 space-y-6 max-w-lg">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Check-In</h1>
        <p className="text-muted-foreground mt-1">
          Scan or enter a QR code to validate tickets
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          onClick={() => { setResult(null); setMode("camera"); }}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera Scan
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => { setResult(null); setMode("manual"); }}
          className="flex-1"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Manual Entry
        </Button>
      </div>

      {mode === "camera" && (
        <Card>
          <CardContent className="pt-6">
            <div
              id="qr-reader"
              ref={scannerContainerRef}
              className="w-full rounded-lg overflow-hidden"
            />
            {scanning && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                <ScanLine className="h-4 w-4 animate-pulse" />
                Point camera at QR code...
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enter QR Code</CardTitle>
            <CardDescription>
              Type or paste the ticket QR code data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="qr-input" className="sr-only">QR Code</Label>
                <Input
                  id="qr-input"
                  placeholder="e.g. UHUB-xxxx-xxxx..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card
          className={
            result.success
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10"
          }
        >
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`font-semibold text-lg ${
                  result.success
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {result.success ? "Check-In Successful" : "Check-In Failed"}
              </span>
            </div>

            <p
              className={`text-sm ${
                result.success
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {result.message}
            </p>

            {result.student && (
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium">{result.student.name}</span>
                  <span className="text-muted-foreground">({result.student.email})</span>
                </div>
                {result.event && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{result.event.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{result.event.location}</span>
                    </div>
                  </>
                )}
                {result.redeemedAt && (
                  <Badge variant="secondary" className="mt-1">
                    Previously redeemed: {new Date(result.redeemedAt).toLocaleString()}
                  </Badge>
                )}
              </div>
            )}

            <Button variant="outline" onClick={resetForNext} className="w-full">
              Scan Next Ticket
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}