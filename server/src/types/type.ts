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
