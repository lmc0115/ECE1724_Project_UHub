import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/events", label: "Events" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/organizer", label: "Organizer" },
  { to: "/staff", label: "Staff" },
  { to: "/login", label: "Login" }
];

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="shell">
      <header className="shell__header">
        <div>
          <p className="eyebrow">University Event Platform</p>
          <h1>UHub</h1>
        </div>
        <nav className="shell__nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="shell__main">{children}</main>
    </div>
  );
}

