import { SectionCard } from "../components/SectionCard";

export function OrganizerPage() {
  return (
    <SectionCard
      title="Organizer Workspace"
      description="This section will be expanded with event CRUD, image upload, and attendance metrics."
    >
      <div className="placeholder-grid">
        <div className="placeholder-box">Create and edit event forms</div>
        <div className="placeholder-box">Registration counts and ticket sales</div>
        <div className="placeholder-box">Published and draft event states</div>
      </div>
    </SectionCard>
  );
}

