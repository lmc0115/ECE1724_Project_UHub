import { createServer } from "http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { ensureBucketCors } from "./lib/s3.js";
import { connectRedis } from "./lib/redis.js";
import { initSocketServer } from "./lib/socket.js";

const server = createServer(app);

initSocketServer(server);

async function start() {
  await connectRedis();

  server.listen(env.PORT, () => {
    console.log(`UHub server listening on http://localhost:${env.PORT}`);
    ensureBucketCors();
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});