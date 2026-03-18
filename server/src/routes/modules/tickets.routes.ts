import { Request, Response, Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";

export const ticketRouter = Router();

// ── POST /api/tickets/verify ── staff scans QR code to verify and redeem ticket
ticketRouter.post("/verify", requireAuth, requireRole("staff"), async (req: Request, res: Response) => {
  try {
    const staffId = req.user!.sub;
    const { qrCodeData } = req.body as { qrCodeData: string };

    if (!qrCodeData) {
      return res.status(400).json({ error: "qrCodeData is required." });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { qrCodeData },
      include: {
        registration: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            event: { select: { id: true, title: true, dateTime: true, location: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Invalid QR code. Ticket not found." });
    }

    if (ticket.redemptionStatus === "REDEEMED") {
      return res.status(400).json({
        error: "Ticket already redeemed.",
        redeemedAt: ticket.redeemedAt,
        student: ticket.registration.student,
        event: ticket.registration.event,
      });
    }

    if (ticket.registration.paymentStatus !== "PAID") {
      return res.status(400).json({
        error: "Ticket payment is not completed.",
        paymentStatus: ticket.registration.paymentStatus,
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        redemptionStatus: "REDEEMED",
        redeemedAt: new Date(),
        validatedByStaffId: staffId,
      },
      include: {
        registration: {
          include: {
            student: { select: { id: true, name: true, email: true } },
            event: { select: { id: true, title: true, dateTime: true, location: true } },
          },
        },
      },
    });

    return res.status(200).json({
      message: "Ticket redeemed successfully.",
      ticket: {
        id: updated.id,
        qrCodeData: updated.qrCodeData,
        redemptionStatus: updated.redemptionStatus,
        redeemedAt: updated.redeemedAt,
      },
      student: updated.registration.student,
      event: updated.registration.event,
    });
  } catch (error) {
    console.error("Verify ticket error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});
