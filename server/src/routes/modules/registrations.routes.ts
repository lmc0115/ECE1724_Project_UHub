import { Router } from "express";

export const registrationRouter = Router();

registrationRouter.get("/", (_req, res) => {
  res.json({
    module: "registrations",
    message: "Registration and simulated payment flow will be implemented later."
  });
});

