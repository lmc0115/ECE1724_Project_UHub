import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "UHub API",
    status: "ok",
    docs: "/api"
  });
});

app.use("/api", apiRouter);

