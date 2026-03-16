import { SectionCard } from "../components/SectionCard";

export function StaffPage() {
  return (
    <SectionCard
      title="Staff Check-In"
      description="This page is reserved for mobile-friendly QR scanning and validation feedback."
    >
      <div className="placeholder-grid">
        <div className="placeholder-box">QR scanner surface</div>
        <div className="placeholder-box">Ticket validation result</div>
        <div className="placeholder-box">Live attendance summary</div>
      </div>
    </SectionCard>
  );
}

