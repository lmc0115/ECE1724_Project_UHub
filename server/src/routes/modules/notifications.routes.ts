import { Router } from "express";

export const notificationRouter = Router();

notificationRouter.get("/", (_req, res) => {
  res.json({
    module: "notifications",
    message: "Notification delivery and read-state endpoints will be implemented later."
  });
});

