import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { api, parseApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const role = params.get("role");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || !role) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    api
      .get<{ message: string }>(`/auth/verify-email?token=${token}&role=${role}`)
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(parseApiError(err));
      });
  }, [token, role]);

  return (
    <div className="container flex items-center justify-center py-20">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-3">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
          </div>
          <CardTitle>
            {status === "loading" && "Verifying your email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{message}</p>

          {status === "success" && (
            <Link to="/account">
              <Button className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Go to Login
              </Button>
            </Link>
          )}

          {status === "error" && (
            <Link to="/account">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
