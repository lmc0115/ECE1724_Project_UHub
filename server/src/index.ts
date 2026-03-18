import { app } from "./app.js";
import { env } from "./config/env.js";
import { ensureBucketCors } from "./lib/s3.js";

app.listen(env.PORT, () => {
  console.log(`UHub server listening on http://localhost:${env.PORT}`);
  ensureBucketCors();
});

