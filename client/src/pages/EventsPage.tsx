import { Link } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";

const eventCards = [
  { id: "sample-1", title: "Hackathon Kickoff", meta: "Technology Club" },
  { id: "sample-2", title: "Career Panel", meta: "Engineering Society" },
  { id: "sample-3", title: "Spring Mixer", meta: "Student Union" }
];

export function EventsPage() {
  return (
    <SectionCard
      title="Event Discovery"
      description="This page marks where browsing, filtering, and poster-based event cards will live."
    >
      <div className="list-grid">
        {eventCards.map((event) => (
          <Link key={event.id} to={`/events/${event.id}`} className="list-item">
            <strong>{event.title}</strong>
            <span>{event.meta}</span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

