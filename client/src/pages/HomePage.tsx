import { SectionCard } from "../components/SectionCard";

export function HomePage() {
  return (
    <div className="stack">
      <SectionCard
        title="Project Structure"
        description="This first step keeps the app runnable while leaving the real feature work for later phases."
      >
        <ul className="plain-list">
          <li>Students browse events and register for tickets.</li>
          <li>Organizers manage event creation and reporting.</li>
          <li>Staff validate QR tickets during check-in.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

