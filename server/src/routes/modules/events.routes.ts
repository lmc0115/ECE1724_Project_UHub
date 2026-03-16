import { Router } from "express";

export const eventRouter = Router();

eventRouter.get("/", (_req, res) => {
  res.json({
    module: "events",
    message: "Event browsing and CRUD endpoints will be added here.",
    items: []
  });
});

eventRouter.get("/:eventId", (req, res) => {
  res.json({
    module: "events",
    eventId: req.params.eventId,
    message: "Event detail endpoint placeholder."
  });
});

