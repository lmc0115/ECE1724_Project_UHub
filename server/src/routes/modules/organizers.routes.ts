import { Router } from "express";

export const organizerRouter = Router();

organizerRouter.get("/", (_req, res) => {
  res.json({
    module: "organizers",
    message: "Organizer dashboard and event management endpoints will be implemented later."
  });
});

