import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { apiRouter } from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);
app.use(express.json());

app.use("/api", apiRouter);

// Serve React build (production)
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

// SPA fallback — must be last
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

