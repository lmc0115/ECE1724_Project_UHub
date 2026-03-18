import { Router } from "express";
import { authRouter } from "./modules/auth.routes.js";
import { eventRouter } from "./modules/events.routes.js";
import { healthRouter } from "./modules/health.routes.js";
import { notificationRouter } from "./modules/notifications.routes.js";
import { organizerRouter } from "./modules/organizers.routes.js";
import { registrationRouter } from "./modules/registrations.routes.js";
import { staffRouter } from "./modules/staff.routes.js";
import { ticketRouter } from "./modules/tickets.routes.js";
import { uploadRouter } from "./modules/upload.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/events", eventRouter);
apiRouter.use("/registrations", registrationRouter);
apiRouter.use("/tickets", ticketRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/organizers", organizerRouter);
apiRouter.use("/staff", staffRouter);
apiRouter.use("/upload", uploadRouter);

apiRouter.get("/", (_req, res) => {
  res.json({
    message: "UHub API structure is ready.",
    modules: ["auth", "events", "registrations", "tickets", "notifications", "organizers", "staff"]
  });
});

