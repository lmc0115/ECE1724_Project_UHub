// ── Auth ──────────────────────────────────────────────────────────────────────

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

// ── Auth request bodies ────────────────────────────────────────────────────────

export type RegisterStudentBody = {
  name?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
};

export type RegisterOrganizerBody = {
  name?: string;
  email?: string;
  password?: string;
  organizationName?: string;
  avatarUrl?: string;
};

export type RegisterStaffBody = {
  name?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
};

export type LoginBody = {
  email?: string;
  password?: string;
};

export type AvatarPresignedUrlBody = {
  contentType?: string;
};

export type AvatarUpdateBody = {
  avatarUrl?: string;
};

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

export type CreateEventData = {
  title: string;
  description: string;
  location: string;
  dateTime: Date;
  capacity: number;
  ticketPrice: number;
  coverImageUrl: string | null;
  status: EventStatusValue;
  organizerId: string;
};

export type UpdateEventData = {
  title?: string;
  description?: string;
  location?: string;
  dateTime?: Date;
  capacity?: number;
  ticketPrice?: number;
  coverImageUrl?: string | null;
  status?: EventStatusValue;
  organizerId?: string;
};
