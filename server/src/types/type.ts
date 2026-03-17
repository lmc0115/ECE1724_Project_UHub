// ── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "organizer" | "staff";

export type AuthPayload = {
  sub: string;
  role: UserRole;
};

// Extend Express Request so authenticated routes can access req.user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

export type EventStatusValue = "DRAFT" | "PUBLISHED" | "CANCELLED";

export type EventRequestBody = {
  name?: string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  dateTime?: string | Date | null;
  capacity?: number | string | null;
  ticketPrice?: number | string | null;
  coverImageUrl?: string | null;
  status?: EventStatusValue | null;
  organizerId?: string | null;
};
