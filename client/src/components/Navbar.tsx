import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  ScanLine,
  LogIn,
  LayoutList,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { useTheme } from "@/context/theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { to: "/", label: "Events", icon: CalendarDays },
  { to: "/my-events", label: "My Events", icon: ClipboardList, role: "student" as const },
  { to: "/organizer/events", label: "My Events", icon: LayoutList, role: "organizer" as const },
  { to: "/check-in", label: "Check-In", icon: ScanLine, role: "staff" as const },
];

export function Navbar() {
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">UHub</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            if (item.role && (!user || user.role !== item.role)) return null;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  active && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          {user ? (
            <Link
              to="/account"
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                location.pathname === "/account" && "bg-accent"
              )}
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">{user.name}</span>
            </Link>
          ) : (
            <Link
              to="/account"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === "/account" && "bg-accent text-accent-foreground"
              )}
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}