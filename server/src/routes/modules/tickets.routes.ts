import { Router } from "express";

export const ticketRouter = Router();

ticketRouter.get("/", (_req, res) => {
  res.json({
    module: "tickets",
    message: "Ticket generation and QR validation endpoints will be implemented later."
  });
});

