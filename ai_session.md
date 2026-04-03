## Session 1: Database Architecture Decision (RDB vs NoSQL vs Redis)

### Prompt (you sent to AI)

Should I store user information and chat messages in a relational database, or should I use a combination of relational and NoSQL databases?

### AI Response (trimmed)

Good question — this depends on data structure and access patterns.

- Use an RDBMS (e.g., PostgreSQL) for user data since it is structured and requires consistency (authentication, relationships).
- Use a NoSQL database (e.g., MongoDB) for chat messages because:
  - Flexible schema (messages can vary)
  - High write throughput
  - Easier horizontal scaling

A hybrid approach is common in systems that separate transactional data from high-volume, semi-structured data.

### What Your Team Did With It

- What was useful
  - Helped us understand separation of concerns between structured and unstructured data
  - Highlighted scalability considerations for chat systems

- What was incorrect, misleading, or not applicable
  - MongoDB was unnecessary for our project scale and added complexity
  - Did not consider real-time requirements and caching needs

- How your team verified, modified, or replaced the suggestion
  - Replaced MongoDB with Redis for chat message storage
  - Used Redis for fast read/write and pub/sub support for real-time communication
  - Verified by testing improved latency and responsiveness in chat features


## Session 2: S3 Upload Strategy (Direct Upload vs Server Proxy)

### Prompt (you sent to AI)

How should I implement image uploads to AWS S3 from my web application?

### AI Response (trimmed)

Good question — there are two common approaches.

- Recommended: use presigned URLs for direct browser-to-S3 upload
  - Backend generates a temporary signed URL
  - Client uploads directly to S3
  - Reduces server load

- Make sure to:
  - Configure S3 bucket CORS properly
  - Restrict permissions via IAM

This is generally considered a scalable and secure pattern.

### What Your Team Did With It

- What was useful
  - Introduced presigned URLs and secure upload patterns
  - Helped understand S3 permissions and access flow

- What was incorrect, misleading, or not applicable
  - Direct upload failed due to CORS issues
  - Suggested CORS configuration did not resolve browser-side failures
  - Overlooked real-world browser restrictions

- How your team verified, modified, or replaced the suggestion
  - Switched to server-side proxy upload using Multer
  - Flow: client → Express server → S3
  - Verified by eliminating "Failed to fetch" errors and ensuring stable uploads


## Session 3: Email Verification Bug (React StrictMode Issue)

### Prompt (you sent to AI)

Why does my email verification API sometimes fail even though the token is valid?

### AI Response (trimmed)

Good debugging question — here are the likely causes.

- Check if the token is:
  - Expired
  - Already used
- Verify backend logic:
  - Token invalidation after first use
- Inspect frontend:
  - Ensure the API is not being called multiple times

This issue is often caused by duplicate requests rather than incorrect backend logic.

### What Your Team Did With It

- What was useful
  - Helped confirm backend logic and database state were correct
  - Encouraged systematic debugging

- What was incorrect, misleading, or not applicable
  - Did not identify React StrictMode double rendering issue
  - Missed frontend lifecycle behavior causing duplicate API calls

- How your team verified, modified, or replaced the suggestion
  - Queried database to confirm email was verified after first request
  - Identified duplicate API calls from useEffect in StrictMode
  - Fixed using a useRef guard to ensure single execution
  - Verified in both development and production environments