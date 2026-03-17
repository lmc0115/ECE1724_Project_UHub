/*
This is a test file for the events routes, testing CRUD operations on a mock event (not accessing the real db)
To run the tests,
1. cd server
2. npm install (if not already installed)
3. npm run dev (to start the server)
4. npm run test

Five cases testing on each route:
1. GET /api/events: List all events
2. GET /api/events/:eventId: Get event by ID
3. POST /api/events: Create a new event
4. PUT /api/events/:eventId: Update an existing event
5. DELETE /api/events/:eventId: Delete an event
*/

import request from "supertest";
import { Decimal } from "@prisma/client/runtime/library";
import { beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Express } from "express";

type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";

type MockEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  dateTime: Date;
  capacity: number;
  ticketPrice: Decimal;
  coverImageUrl: string | null;
  status: EventStatus;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
};

type FindManyArgs = {
  orderBy: {
    createdAt: "asc" | "desc";
  };
};

type FindUniqueArgs = {
  where: {
    id: string;
  };
};

type CreateArgs = {
  data: {
    title: string;
    description: string;
    location: string;
    dateTime: Date;
    capacity: number;
    ticketPrice: number;
    coverImageUrl: string | null;
    status: EventStatus;
    organizerId: string;
  };
};

type UpdateArgs = {
  where: {
    id: string;
  };
  data: {
    title?: string;
    description?: string;
    location?: string;
    dateTime?: Date;
    capacity?: number;
    ticketPrice?: number;
    coverImageUrl?: string | null;
    status?: EventStatus;
    organizerId?: string;
  };
};

type DeleteArgs = {
  where: {
    id: string;
  };
};

const prismaMock = {
  event: {
    findMany: jest.fn<(args: FindManyArgs) => Promise<MockEvent[]>>(),
    findUnique: jest.fn<(args: FindUniqueArgs) => Promise<MockEvent | null>>(),
    create: jest.fn<(args: CreateArgs) => Promise<MockEvent>>(),
    update: jest.fn<(args: UpdateArgs) => Promise<MockEvent>>(),
    delete: jest.fn<(args: DeleteArgs) => Promise<MockEvent>>()
  }
};

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  prisma: prismaMock
}));

let app: Express;

const sampleEvent: MockEvent = {
  id: "11111111-1111-1111-1111-111111111111",
  title: "Hackathon Kickoff",
  description: "Opening event for the hackathon.",
  location: "BA 1130",
  dateTime: new Date("2026-04-01T18:00:00.000Z"),
  capacity: 120,
  ticketPrice: new Decimal("0"),
  coverImageUrl: "https://example.com/event.png",
  status: "PUBLISHED",
  organizerId: "22222222-2222-2222-2222-222222222222",
  createdAt: new Date("2026-03-16T10:00:00.000Z"),
  updatedAt: new Date("2026-03-16T10:00:00.000Z")
};

const toJsonEvent = (event: MockEvent) => ({
  ...event,
  dateTime: event.dateTime.toISOString(),
  ticketPrice: event.ticketPrice.toString(),
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString()
});

describe("events.routes", () => {
  beforeAll(async () => {
    ({ app } = await import("../src/app.js"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/events returns all events", async () => {
    prismaMock.event.findMany.mockResolvedValue([sampleEvent]);

    const response = await request(app).get("/api/events");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([toJsonEvent(sampleEvent)]);
    expect(prismaMock.event.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc"
      }
    });
  });

  it("GET /api/events/:eventId returns one event by id", async () => {
    prismaMock.event.findUnique.mockResolvedValue(sampleEvent);

    const response = await request(app).get(`/api/events/${sampleEvent.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(toJsonEvent(sampleEvent));
    expect(prismaMock.event.findUnique).toHaveBeenCalledWith({
      where: {
        id: sampleEvent.id
      }
    });
  });

  it("POST /api/events creates an event", async () => {
    prismaMock.event.create.mockResolvedValue(sampleEvent);

    const payload = {
      name: "Hackathon Kickoff",
      description: "Opening event for the hackathon.",
      location: "BA 1130",
      dateTime: "2026-04-01T18:00:00.000Z",
      capacity: 120,
      ticketPrice: 0,
      organizerId: "22222222-2222-2222-2222-222222222222"
    };

    const response = await request(app).post("/api/events").send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(toJsonEvent(sampleEvent));
    expect(prismaMock.event.create).toHaveBeenCalledWith({
      data: {
        title: payload.name,
        description: payload.description,
        location: payload.location,
        dateTime: new Date(payload.dateTime),
        capacity: payload.capacity,
        ticketPrice: payload.ticketPrice,
        coverImageUrl: null,
        status: "DRAFT",
        organizerId: payload.organizerId
      }
    });
  });

  it("PUT /api/events/:eventId updates an event", async () => {
    const updatedEvent: MockEvent = {
      ...sampleEvent,
      title: "Updated Hackathon Kickoff",
      capacity: 150
    };

    prismaMock.event.findUnique.mockResolvedValue(sampleEvent);
    prismaMock.event.update.mockResolvedValue(updatedEvent);

    const response = await request(app)
      .put(`/api/events/${sampleEvent.id}`)
      .send({
        name: "Updated Hackathon Kickoff",
        capacity: 150
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(toJsonEvent(updatedEvent));
    expect(prismaMock.event.update).toHaveBeenCalledWith({
      where: {
        id: sampleEvent.id
      },
      data: {
        title: "Updated Hackathon Kickoff",
        capacity: 150
      }
    });
  });

  it("DELETE /api/events/:eventId deletes an event", async () => {
    prismaMock.event.findUnique.mockResolvedValue(sampleEvent);
    prismaMock.event.delete.mockResolvedValue(sampleEvent);

    const response = await request(app).delete(`/api/events/${sampleEvent.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Event deleted successfully"
    });
    expect(prismaMock.event.delete).toHaveBeenCalledWith({
      where: {
        id: sampleEvent.id
      }
    });
  });
});
