/*
This file defines the API routes for managing events in the UHub application. It includes endpoints for creating, retrieving, updating, and deleting events. The routes are implemented using Express and interact with a Prisma client to perform database operations. Input validation and error handling are included to ensure robust API behavior.
The main routes are:
- GET /api/events: List all events
- GET /api/events/:eventId: Get event by ID
- POST /api/events: Create a new event
- PUT /api/events/:eventId: Update an existing event
- DELETE /api/events/:eventId: Delete an event

Each route includes input normalization and validation to handle various input formats and ensure data integrity. Server errors are logged and returned with a 500 status code, while client errors (e.g., invalid input, not found) return appropriate status codes and error messages.

Helper Functions:
- parseDateTime: Parses and validates dateTime input, allowing for undefined, null, or valid date strings.
- parseNumber: Parses and validates numeric input, allowing for undefined, null, empty strings, or valid numbers.
- normalizeCreateInput: Normalizes and validates input for creating an event, ensuring required fields are present and correctly formatted.
- normalizeUpdateInput: Normalizes and validates input for updating an event, allowing for partial updates while ensuring any provided fields are correctly formatted.
- sendServerError: Handles server errors by logging the error and sending a standardized error response to the client.
*/

import { Request, Response, Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { generatePresignedUploadUrl, isAllowedImageType, keyFromPublicUrl, deleteS3Object } from "../../lib/s3.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  EventRequestBody,
  EventStatusValue,
  CreateEventData,
  UpdateEventData
} from "../../types/type.js";

export const eventRouter = Router();

// parse and validate input for dateTime and numeric fields
const parseDateTime = (value: EventRequestBody["dateTime"]) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// parse and validate numeric fields, allowing both number and string inputs
const parseNumber = (value: number | string | null | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

// normalize and validate input for creating an event
const normalizeCreateInput = (body: EventRequestBody) => {
  const title = body.name ?? body.title;
  const dateTime = parseDateTime(body.dateTime);
  const capacity = parseNumber(body.capacity);
  const ticketPrice = parseNumber(body.ticketPrice);

  if (!title) {
    return {
      error: "Event name is required."
    } as const;
  }

  if (!body.description || !body.location || !body.organizerId || dateTime == null || capacity == null || ticketPrice == null) {
    return {
      error:
        "description, location, dateTime, capacity, ticketPrice, and organizerId are required."
    } as const;
  }

  const data: CreateEventData = {
    title,
    description: body.description,
    location: body.location,
    dateTime,
    capacity,
    ticketPrice,
    coverImageUrl: body.coverImageUrl ?? null,
    status: (body.status ?? "DRAFT") as EventStatusValue,
    organizerId: body.organizerId
  };

  return {
    data
  } as const;
};

// normalize and validate input for updating an event, allowing partial updates
const normalizeUpdateInput = (body: EventRequestBody) => {
  const data: UpdateEventData = {};

  if (body.name !== undefined || body.title !== undefined) {
    const title = body.name ?? body.title;
    if (!title) {
      return {
        error: "Event name cannot be null or empty."
      } as const;
    }
    data.title = title;
  }

  if (body.description !== undefined) {
    if (!body.description) {
      return {
        error: "description cannot be null or empty."
      } as const;
    }
    data.description = body.description;
  }

  if (body.location !== undefined) {
    if (!body.location) {
      return {
        error: "location cannot be null or empty."
      } as const;
    }
    data.location = body.location;
  }

  if (body.dateTime !== undefined) {
    const dateTime = parseDateTime(body.dateTime);
    if (dateTime === null) {
      return {
        error: "dateTime must be a valid date."
      } as const;
    }
    data.dateTime = dateTime;
  }

  if (body.capacity !== undefined) {
    const capacity = parseNumber(body.capacity);
    if (capacity === null) {
      return {
        error: "capacity must be a valid number."
      } as const;
    }
    data.capacity = capacity;
  }

  if (body.ticketPrice !== undefined) {
    const ticketPrice = parseNumber(body.ticketPrice);
    if (ticketPrice === null) {
      return {
        error: "ticketPrice must be a valid number."
      } as const;
    }
    data.ticketPrice = ticketPrice;
  }

  if (body.coverImageUrl !== undefined) {
    data.coverImageUrl = body.coverImageUrl;
  }

  if (body.status !== undefined) {
    if (!body.status) {
      return {
        error: "status cannot be null."
      } as const;
    }
    data.status = body.status as EventStatusValue;
  }

  if (body.organizerId !== undefined) {
    if (!body.organizerId) {
      return {
        error: "organizerId cannot be null or empty."
      } as const;
    }
    data.organizerId = body.organizerId;
  }

  if (Object.keys(data).length === 0) {
    return {
      error: "At least one field is required to update the event."
    } as const;
  }

  return { data } as const;
};

// handle error codes with status of 500 and log the error for debugging
const sendServerError = (res: Response, error: unknown) => {
  console.error("Event route error:", error);
  return res.status(500).json({
    error: "Internal server error"
  });
};

// ── POST /api/events/upload-url ───────────────────────────────────────────────
// Step 1 of the event cover-image upload flow (JWT required).
// Returns a presigned S3 PUT URL valid for 5 minutes.
// The client uploads the image directly to S3, then passes the returned
// publicUrl as coverImageUrl when creating or updating an event.

eventRouter.post("/upload-url", requireAuth, async (req: Request, res: Response) => {
  try {
    const { contentType } = req.body as { contentType?: string };

    if (!contentType) {
      return res.status(400).json({ error: "contentType is required." });
    }
    if (!isAllowedImageType(contentType)) {
      return res.status(400).json({
        error: "Unsupported image type. Allowed: image/jpeg, image/png, image/webp, image/gif."
      });
    }

    const { sub: organizerId } = req.user!;
    const { uploadUrl, publicUrl, key } = await generatePresignedUploadUrl(
      "events/covers",
      organizerId,
      contentType
    );

    return res.status(200).json({ uploadUrl, publicUrl, key });
  } catch (error) {
    return sendServerError(res, error);
  }
});

// ── DELETE /api/events/:eventId/cover-image ───────────────────────────────────
// Removes the cover image from S3 and clears the coverImageUrl on the event.

eventRouter.delete("/:eventId/cover-image", requireAuth, async (req: Request<{ eventId: string }>, res: Response) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (!event.coverImageUrl) {
      return res.status(400).json({ error: "This event has no cover image." });
    }

    const oldKey = keyFromPublicUrl(event.coverImageUrl);
    if (oldKey) await deleteS3Object(oldKey).catch(() => null);

    const updated = await prisma.event.update({
      where: { id: String(req.params.eventId) },
      data:  { coverImageUrl: null }
    });

    return res.status(200).json(updated);
  } catch (error) {
    return sendServerError(res, error);
  }
});

//Here starts the HTTP requests
// GET /api/events - list all events
eventRouter.get("/", async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.status(200).json(events);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// GET /api/events/:eventId - get event by ID
eventRouter.get("/:eventId", async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: {
        id: req.params.eventId
      }
    });

    if (!event) {
      return res.status(404).json({
        error: "Event not found"
      });
    }

    return res.status(200).json(event);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// POST /api/events - create a new event
eventRouter.post("/", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error: "Request body is required."
      });
    }

    const normalized = normalizeCreateInput(req.body as EventRequestBody);

    if ("error" in normalized) {
      return res.status(400).json({
        error: normalized.error
      });
    }

    const event = await prisma.event.create({
      data: normalized.data
    });

    return res.status(200).json(event);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// PUT /api/events/:eventId - update an existing event
eventRouter.put("/:eventId", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        error: "Request body is required."
      });
    }

    const existingEvent = await prisma.event.findUnique({
      where: {
        id: req.params.eventId
      }
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Event not found"
      });
    }

    const normalized = normalizeUpdateInput(req.body as EventRequestBody);

    if ("error" in normalized) {
      return res.status(400).json({
        error: normalized.error
      });
    }

    const event = await prisma.event.update({
      where: {
        id: req.params.eventId
      },
      data: normalized.data
    });

    return res.status(200).json(event);
  } catch (error) {
    return sendServerError(res, error);
  }
});

// DELETE /api/events/:eventId - delete an event
eventRouter.delete("/:eventId", async (req, res) => {
  try {
    const existingEvent = await prisma.event.findUnique({
      where: {
        id: req.params.eventId
      }
    });

    if (!existingEvent) {
      return res.status(404).json({
        error: "Event not found"
      });
    }

    await prisma.event.delete({
      where: {
        id: req.params.eventId
      }
    });

    return res.status(200).json({
      message: "Event deleted successfully"
    });
  } catch (error) {
    return sendServerError(res, error);
  }
});
