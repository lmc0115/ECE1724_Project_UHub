import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, User, Shield, Upload, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  login,
  registerStudent,
  registerOrganizer,
  registerStaff,
  logout,
  updateProfile,
  uploadAvatar,
  clearError,
  clearRegistrationSuccess,
} from "@/store/authSlice";
import { api, parseApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AccountPage() {
  const dispatch = useAppDispatch();
  const { user, loading, error } = useAppSelector((s) => s.auth);

  if (user) return <ProfileView />;
  return <AuthForms />;
}

type Role = "student" | "organizer" | "staff";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "Browse and register for events" },
  { value: "organizer", label: "Organizer", description: "Create and manage events" },
  { value: "staff", label: "Staff", description: "Validate tickets at check-in" },
];

function AuthForms() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, registrationSuccess, needsVerification, verifyEmail } = useAppSelector((s) => s.auth);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regRole, setRegRole] = useState<Role>("student");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regOrgName, setRegOrgName] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ email: loginEmail, password: loginPassword }));
    if (login.fulfilled.match(result)) navigate("/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (regRole === "organizer") {
      await dispatch(
        registerOrganizer({
          name: regName,
          email: regEmail,
          password: regPassword,
          organizationName: regOrgName,
        })
      );
    } else if (regRole === "staff") {
      await dispatch(
        registerStaff({ name: regName, email: regEmail, password: regPassword })
      );
    } else {
      await dispatch(
        registerStudent({ name: regName, email: regEmail, password: regPassword })
      );
    }
  };

  const handleResendVerification = async (email: string) => {
    setResending(true);
    setResendMsg(null);
    try {
      const result = await api.post<{ message: string }>("/auth/resend-verification", { email });
      setResendMsg(result.message);
    } catch (err: any) {
      setResendMsg(parseApiError(err));
    }
    setResending(false);
  };

  if (registrationSuccess) {
    return (
      <div className="container flex items-center justify-center py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-3">
              <div className="rounded-full bg-emerald-100 p-3">
                <User className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
            <CardTitle>Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{regEmail}</strong>.
              Please check your inbox and click the link to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleResendVerification(regEmail)}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend Verification Email"}
            </Button>
            {resendMsg && (
              <p className="text-sm text-muted-foreground">{resendMsg}</p>
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => dispatch(clearRegistrationSuccess())}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <User className="h-12 w-12 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold">Welcome to UHub</h1>
          <p className="text-muted-foreground text-sm">
            Sign in or create an account to get started
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive mb-4 space-y-2">
            <p className="cursor-pointer" onClick={() => dispatch(clearError())}>{error}</p>
            {needsVerification && verifyEmail && (
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleResendVerification(verifyEmail)}
                  disabled={resending}
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {resending ? "Sending..." : "Resend Verification Email"}
                </Button>
                {resendMsg && <p className="text-xs text-muted-foreground">{resendMsg}</p>}
              </div>
            )}
          </div>
        )}

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <form onSubmit={handleLogin}>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <form onSubmit={handleRegister}>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Choose your role and fill in your details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {ROLE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRegRole(opt.value)}
                          className={`rounded-lg border p-3 text-center transition-all ${
                            regRole === opt.value
                              ? "border-primary bg-primary/5 ring-2 ring-primary"
                              : "border-input hover:bg-accent"
                          }`}
                        >
                          <span className="block text-sm font-medium">{opt.label}</span>
                          <span className="block text-[11px] text-muted-foreground mt-0.5 leading-tight">
                            {opt.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      placeholder="Your name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>

                  {regRole === "organizer" && (
                    <div className="space-y-2">
                      <Label htmlFor="reg-org">Organization Name</Label>
                      <Input
                        id="reg-org"
                        placeholder="e.g. Computer Science Club"
                        value={regOrgName}
                        onChange={(e) => setRegOrgName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProfileView() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, loading } = useAppSelector((s) => s.auth);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(updateProfile({ name, email }));
    if (updateProfile.fulfilled.match(result)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAvatarError(null);
    const result = await dispatch(uploadAvatar(file));
    setUploading(false);

    if (uploadAvatar.rejected.match(result)) {
      setAvatarError(result.payload as string);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="container py-6 max-w-lg space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Account</h1>

      <Card>
        <CardHeader className="items-center">
          <button
            type="button"
            onClick={() => user.avatarUrl && setShowPreview(true)}
            className={user.avatarUrl ? "cursor-pointer" : "cursor-default"}
          >
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            {uploading ? "Uploading..." : "Upload Photo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />

          {avatarError && (
            <p className="text-xs text-destructive mt-1">{avatarError}</p>
          )}
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="secondary" className="capitalize">
              <Shield className="h-3 w-3 mr-1" />
              {user.role}
            </Badge>
            {user.organizationName && (
              <Badge variant="outline">{user.organizationName}</Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {showPreview && user.avatarUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div className="relative max-w-lg w-full mx-4">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-10 right-0 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-full rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSave}>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {saved ? "Saved!" : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
