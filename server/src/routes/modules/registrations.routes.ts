import { Request, Response, Router } from "express";
import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";

export const registrationRouter = Router();

// ── POST /api/registrations ── register current student for an event
registrationRouter.post("/", requireAuth, requireRole("student"), async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.sub;
    const { eventId } = req.body as { eventId: string };

    if (!eventId) {
      return res.status(400).json({ error: "eventId is required." });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.status !== "PUBLISHED") {
      return res.status(400).json({ error: "Event is not open for registration." });
    }

    const existing = await prisma.registration.findUnique({
      where: { studentId_eventId: { studentId, eventId } },
    });
    if (existing) {
      return res.status(409).json({ error: "Already registered for this event." });
    }

    const regCount = await prisma.registration.count({ where: { eventId } });
    if (regCount >= event.capacity) {
      return res.status(400).json({ error: "Event is at full capacity." });
    }

    const qrCodeData = `UHUB-${randomUUID()}`;

    const registration = await prisma.registration.create({
      data: {
        studentId,
        eventId,
        paymentStatus: Number(event.ticketPrice) === 0 ? "PAID" : "PAID",
      },
    });

    await prisma.ticket.create({
      data: {
        registrationId: registration.id,
        qrCodeData,
        redemptionStatus: "NOT_REDEEMED",
      },
    });

    const full = await prisma.registration.findUnique({
      where: { id: registration.id },
      include: {
        event: { include: { organizer: { select: { id: true, name: true, organizationName: true } } } },
        ticket: true,
      },
    });

    return res.status(201).json(full);
  } catch (error) {
    console.error("Create registration error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── GET /api/registrations/my ── get current student's registrations
registrationRouter.get("/my", requireAuth, requireRole("student"), async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.sub;

    const registrations = await prisma.registration.findMany({
      where: { studentId },
      include: {
        event: { include: { organizer: { select: { id: true, name: true, organizationName: true } } } },
        ticket: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(registrations);
  } catch (error) {
    console.error("Fetch registrations error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── DELETE /api/registrations/:id ── cancel a registration
registrationRouter.delete("/:id", requireAuth, requireRole("student"), async (req: Request, res: Response) => {
  try {
    const studentId = req.user!.sub;
    const id = String(req.params.id);

    const registration = await prisma.registration.findUnique({ where: { id } });
    if (!registration) return res.status(404).json({ error: "Registration not found." });
    if (registration.studentId !== studentId) {
      return res.status(403).json({ error: "Not your registration." });
    }

    await prisma.ticket.deleteMany({ where: { registrationId: id } });
    await prisma.registration.delete({ where: { id } });

    return res.status(200).json({ message: "Registration cancelled." });
  } catch (error) {
    console.error("Cancel registration error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});
