import { Router } from "express";

export const staffRouter = Router();

staffRouter.get("/", (_req, res) => {
  res.json({
    module: "staff",
    message: "Staff check-in and attendance monitoring endpoints will be implemented later."
  });
});
