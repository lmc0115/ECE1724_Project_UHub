import { SectionCard } from "../components/SectionCard";

export function LoginPage() {
  return (
    <SectionCard
      title="Authentication Placeholder"
      description="Week 2 will add role-based login, registration, and protected routes."
    >
      <div className="placeholder-grid">
        <div className="placeholder-box">Student login form</div>
        <div className="placeholder-box">Organizer login form</div>
        <div className="placeholder-box">Staff login form</div>
      </div>
    </SectionCard>
  );
}

