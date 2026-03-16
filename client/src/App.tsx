import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { EventsPage } from "./pages/EventsPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { OrganizerPage } from "./pages/OrganizerPage";
import { StaffPage } from "./pages/StaffPage";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/organizer" element={<OrganizerPage />} />
        <Route path="/staff" element={<StaffPage />} />
      </Routes>
    </AppLayout>
  );
}

