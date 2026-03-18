import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { HomePage } from "@/pages/HomePage";
import { EventDetailPage } from "@/pages/EventDetailPage";
import { MyEventsPage } from "@/pages/MyEventsPage";
import { AccountPage } from "@/pages/AccountPage";
import { StaffCheckInPage } from "@/pages/StaffCheckInPage";
import { OrganizerEventsPage } from "@/pages/OrganizerEventsPage";
import { EventFormPage } from "@/pages/EventFormPage";
import { useAppDispatch, useAppSelector } from "@/store";
import { fetchMe } from "@/store/authSlice";

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, [dispatch, token]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/check-in" element={<StaffCheckInPage />} />
        <Route path="/organizer/events" element={<OrganizerEventsPage />} />
        <Route path="/organizer/events/new" element={<EventFormPage />} />
        <Route path="/organizer/events/:eventId/edit" element={<EventFormPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Routes>
    </div>
  );
}
