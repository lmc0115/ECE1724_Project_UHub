export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "organizer" | "staff";
  avatarUrl?: string;
  organizationName?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  dateTime: string;
  capacity: number;
  ticketPrice: number;
  coverImageUrl?: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  organizerId: string;
  organizer?: {
    id: string;
    name: string;
    organizationName: string;
  };
  registeredCount?: number;
  checkedInCount?: number;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  studentId: string;
  eventId: string;
  registrationDate: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  event?: Event;
  ticket?: Ticket;
}

export interface Ticket {
  id: string;
  registrationId: string;
  qrCodeData: string;
  redemptionStatus: "NOT_REDEEMED" | "REDEEMED";
  redeemedAt?: string;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  role: "student" | "organizer";
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}