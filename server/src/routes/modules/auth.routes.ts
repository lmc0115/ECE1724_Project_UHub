import { Router } from "express";

export const authRouter = Router();

authRouter.get("/", (_req, res) => {
  res.json({
    module: "auth",
    message: "Authentication routes will be implemented in Week 2."
  });
});

