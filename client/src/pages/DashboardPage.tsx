import { SectionCard } from "../components/SectionCard";

export function DashboardPage() {
  return (
    <SectionCard
      title="Student Dashboard"
      description="This will hold registrations, ticket status, and notifications."
    >
      <div className="placeholder-grid">
        <div className="placeholder-box">Upcoming registrations</div>
        <div className="placeholder-box">QR tickets</div>
        <div className="placeholder-box">Notification center</div>
      </div>
    </SectionCard>
  );
}

