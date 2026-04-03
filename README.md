# UHub — University Campus Activity Hub

## 0.0 Team Information

| Name | Student Number | Email |
|------|---------------|-------|
| Muchen Liu | 1006732145 | muchen.liu@mail.utoronto.ca |
| Jerry Chen | 1006944899 | jianuojerry.chen@mail.utoronto.ca |
| Ziyan Liu | 1011801926 | zycathy.liu@mail.utoronto.ca |

## 1.0 Motivation

Held events are one of the most important parts of university life, yet the infrastructure supporting them has not kept pace. Across campuses, event information is scattered across Instagram pages, Discord servers, club newsletters, and word of mouth. This fragmentation leaves students without a centralized place to discover what is happening, creating a two sided problem. Students miss out on events simply because they never hear about them, while organizers struggle to reach their full potential audience despite their promotional efforts.

The challenges extend beyond discovery. Even when students successfully find and register for an event, organizers often face operational bottlenecks at the entrance. Manual or disjointed check in processes slow down entry, create queues, and add unnecessary administrative burden to what should be a seamless experience. To address these issues, this project proposes the development of a centralized web platform for university campus activities. Students will be able to browse events, view detailed information, register or purchase tickets, and receive a QR code for streamlined check in, while organizers can create and manage events, track registrations, and validate attendance efficiently through an integrated QR scanning system.

The significance of this project lies in its ability to address a genuine and recurring need shared by students and organizations across virtually every university campus. While existing tools such as Google Forms, Eventbrite, and social media are useful in isolation, none offers a campus specific, end to end solution that integrates event discovery, registration, and check in within a single cohesive platform. By unifying these functions, the platform improves event visibility, reduces administrative overhead, and creates a more connected and engaging campus experience that current solutions do not fully provide.

For the target users, UHub is designed for three distinct user groups:

1. **Students** who need a single place to discover campus events, register, and receive QR-coded tickets.
2. **Organizers** (clubs, societies, departments) who need efficient tools to create events, manage registrations, and track attendance.
3. **Staff** who require fast and reliable QR-based check-in at event doors.

## 2.0 Objectives

UHub aims to create a unified web platform for university campus activities, guided by three core objectives:

1. **Centralize event discovery and real-time communication.** Provide a single destination where students browse all campus activities, communicate with organizers through live chat, and stay informed without checking scattered sources.

2. **Streamline registration and ticketing end-to-end.** Enable students to register, simulate payment for paid events, and receive QR-coded tickets — all without leaving the platform. Organizers create, edit, and manage events with full control over event information, including cover images stored on AWS S3.

3. **Improve the on-site event experience through integrated QR-based attendance validation.** Staff scan QR codes at the door to verify registrations instantly, preventing duplicate check-ins and eliminating manual processes. Organizers monitor registrations and attendance metrics in real time through a dashboard.

## 3.0 Technical Stack

UHub uses a **separated frontend and backend architecture** deployed as an npm monorepo with workspaces.

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Component-based SPA with type safety |
| **Styling** | Tailwind CSS + shadcn/ui (Radix primitives) | Utility-first CSS with accessible, themeable UI components |
| **State Management** | Redux Toolkit | Centralized state with async thunks for API calls |
| **Routing** | React Router DOM v6 | Client-side routing with role-aware navigation |
| **Backend** | Express.js + TypeScript | RESTful API with middleware-based architecture |
| **Database** | PostgreSQL | Relational storage with Prisma ORM for type-safe queries and migrations |
| **Authentication** | JWT (jsonwebtoken) + bcrypt | Stateless token-based auth with role-based middleware |
| **Email** | Nodemailer (Gmail SMTP / Ethereal) | Email verification on registration |
| **File Storage** | AWS S3 | Profile avatars and event cover images via server-side proxy upload |
| **Real-time Chat** | Socket.IO + Redis Adapter | Event-scoped live chat between organizers and registered students |
| **QR Codes** | qrcode.react (generation) + html5-qrcode (scanning) | Ticket QR generation and staff-side camera scanning |
| **Build Tool** | Vite | Fast dev server with HMR and API proxy |
| **Deployment** | Fly.io | Container-based deployment with managed PostgreSQL and Redis |
| **Dark Mode** | Custom ThemeProvider with CSS variables | System-preference-aware light/dark toggle persisted to localStorage |


## 4.0 Features

### 4.1 Event Discovery and Browsing

Students browse all published campus events on the home page displayed as responsive cards. A real-time search bar filters events by title, location, or description. Each card shows the event cover image, date, location, and a truncated description. Clicking a card navigates to the full event detail page.

**Technical realization:** The frontend dispatches `fetchEvents` (Redux thunk) which calls `GET /api/events`. The Express route queries all events from PostgreSQL via Prisma, including organizer info and registration statistics. Client-side filtering runs against the loaded event list for instant search without additional API calls.

### 4.2 Secure Authentication with Email Verification

Users register by selecting their role (student, organizer, or staff) and providing credentials. A verification email is sent immediately upon registration. Users cannot log in until their email is verified. If a user attempts to re-register with an unverified email, the system updates the existing account with new credentials and resends the verification email rather than creating a duplicate.

**Technical realization:** Passwords are hashed with bcrypt (12 rounds). Registration generates a UUID verification token stored in the database and sends an HTML email via Nodemailer containing a verification link. The `GET /api/auth/verify-email` endpoint validates the token, sets `emailVerified = true`, and clears the token. Login checks `emailVerified` before issuing a JWT. The frontend `VerifyEmailPage` uses a `useRef` guard to prevent React StrictMode double-invocation from consuming the token twice.

### 4.3 Role-Based Access Control

Three distinct roles — student, organizer, and staff — each see different navigation links and have access to different features. The backend enforces role restrictions via `requireAuth` and `requireRole` middleware on every protected route.

**Technical realization:** JWTs encode `{ sub: userId, role }` and are verified on each request. The `requireRole(...roles)` middleware rejects requests from users without the required role. The frontend conditionally renders navigation links and page content based on the authenticated user's role stored in Redux state.

### 4.4 Event Creation and Management (Organizer)

Organizers create events with title, description, location, date/time, capacity, ticket price, status (Draft/Published/Cancelled), and an optional cover image. The "My Events" dashboard lists only events created by the authenticated organizer, with aggregate statistics (total registered, revenue, checked-in count). Organizers can edit or delete only their own events, enforced both client-side and server-side.

**Technical realization:** `POST /api/events` sets `organizerId` from the JWT payload, not from the request body, preventing impersonation. `PUT` and `DELETE` routes verify ownership by comparing the event's `organizerId` against `req.user.sub`. Cover images are uploaded via `POST /api/upload/event-cover` using Multer for multipart handling, then streamed to AWS S3 via `uploadBufferToS3`. The dashboard polls `GET /api/events/my` every 10 seconds for live updates.

### 4.5 Event Registration and QR Ticketing (Student)

Students register for published events from the event detail page. For paid events, a payment summary is displayed before registration (payment is simulated). Upon successful registration, a unique QR-coded ticket is generated and can be displayed on-screen. Students view all their registrations on the "My Events" page, where they can expand QR codes or cancel registrations that haven't been redeemed.

**Technical realization:** `POST /api/registrations` runs atomically — it checks event existence, publication status, duplicate registration, and capacity in a single transaction. On success it creates both a `Registration` and a `Ticket` record with `qrCodeData = "UHUB-${uuid}"`. The frontend renders QR codes using `QRCodeSVG` from the `qrcode.react` library. The unique constraint `@@unique([studentId, eventId])` in Prisma prevents duplicate registrations at the database level.

### 4.6 QR Code Check-In (Staff)

Staff members access a dedicated check-in page with two modes: camera scanning (using the device camera) and manual QR code entry. After scanning, the system validates the ticket, marks it as redeemed, and displays student and event information with a success or error result.

**Technical realization:** The staff page dynamically imports `html5-qrcode` to access the device camera and decode QR codes. `POST /api/tickets/verify` looks up the ticket by `qrCodeData`, checks that it hasn't been previously redeemed and that payment status is `PAID`, then updates `redemptionStatus` to `REDEEMED` with a timestamp and the validating staff member's ID. Already-redeemed tickets return a 400 error with the prior redemption details.

### 4.7 Real-Time Live Chat (Socket.IO + Redis)

Each event has a live chat where the event organizer and registered students can communicate in real time. Chat messages are persisted in Redis and the last 50 messages are loaded as history when joining. The chat is scoped per event — only the organizer who owns the event and students who have registered for it can participate.

**Technical realization:** The server initializes Socket.IO with a Redis adapter for horizontal scalability. On `chat:join`, the server verifies the user's JWT, checks role-specific access (organizer must own the event; student must have a registration), and joins the user to a room named `event:${eventId}`. Messages are persisted using Redis `RPUSH` with a trim to 50 entries. The client `LiveChatCard` component manages socket lifecycle, renders chat bubbles with role badges and timestamps, and enforces a 500-character message limit.

### 4.8 Profile Management and Image Upload

All users can update their name and email, upload a profile avatar, and view their avatar in a full-screen lightbox. Event cover images are also viewable in a lightbox on the detail page.

**Technical realization:** Avatar uploads go through `POST /api/upload/avatar`, which uses Multer to receive multipart form data, validates file type and size (5 MB max, JPEG/PNG/WebP/GIF), uploads the buffer to S3, deletes the old avatar object if one exists, and updates the user's `avatarUrl` in the database. The frontend uses `uploadFile` which sends `FormData` directly, bypassing S3 CORS issues entirely through server-side proxy.

### 4.9 Dark Mode

A theme toggle in the navigation bar switches between light and dark modes. The theme respects the user's system preference on first visit and persists the choice to localStorage.

**Technical realization:** A `ThemeProvider` React context manages the `"light" | "dark"` state, toggling the `dark` class on `document.documentElement`. Tailwind's `darkMode: ["class"]` configuration enables all dark-variant utility classes. CSS custom properties in `index.css` define HSL color tokens for both `:root` and `.dark` selectors.

### 4.10 Security Enhancements

Beyond standard JWT authentication, the system captures the client's IP address (respecting `X-Forwarded-For` from Fly.io's proxy) and generates a server-side device fingerprint (SHA-256 hash of User-Agent + Accept headers) on registration. These are stored for audit and potential anomaly detection.

## 5.0 User Guide

### 5.1 Browsing Events

1. Visit the home page to see all published campus events as cards.
2. Use the search bar to filter events by title, location, or description.
3. Click any card to view full event details, including description, date, location, capacity, and ticket price.

![Home page — event cards with search](Picture/p1.png)

![Event detail page](Picture/p2.png)

### 5.2 Registration and Login

1. Click **Login** in the top navigation bar.
2. Select the **Register** tab and choose your role (Student, Organizer, or Staff).
3. Fill in your details and submit. A verification email will be sent to your address.
4. Open the email and click **Verify Email**. You will see a success confirmation.
5. Return to the login page and sign in with your credentials.

![Registration form](Picture/p3.png)

![Email verification](Picture/p4.png)

### 5.3 Registering for an Event (Student)

1. Log in as a student and navigate to an event detail page.
2. Click **Register Now**. For paid events, review the payment summary and confirm.
3. After registration, click **Show QR Code** to display your ticket QR code.
4. Visit **My Events** in the navigation bar to see all your registrations and QR codes.

![Student event registration and QR code](Picture/p5.png)

### 5.4 Checking In Attendees (Staff)

1. Log in as a staff member and click **Check-In** in the navigation bar.
2. Choose **Camera** mode to scan a student's QR code using your device camera, or **Manual** mode to type in the QR code string.
3. The system will display a success message with student and event details, or an error if the ticket is invalid or already redeemed.

![Staff check-in — camera scan](Picture/p6.png)

![Staff check-in — verification result](Picture/p7.png)

### 5.5 Managing Events (Organizer)

1. Log in as an organizer and click **My Events** in the navigation bar.
2. Click **Create Event** to add a new event. Fill in all fields and optionally upload a cover image.
3. Set the status to **Published** to make the event visible to students.
4. Use the **Edit** and **Delete** buttons on your events to manage them.
5. Click an event card to view its detail page with registration statistics and live chat.
6. The dashboard at the top of the My Events page shows aggregate statistics: **Total Events**, **Total Registered**, **Total Revenue**, and **Total Checked In** across all your events.

![Organizer — My Events dashboard](Picture/p8.png)

![Organizer — create/edit event form](Picture/p9.png)

### 5.6 Live Chat

1. On an event detail page, registered students and the event organizer will see a **Live Chat** card.
2. Type a message and press Send (or Enter) to chat in real time.
3. Chat history (last 50 messages) loads automatically when joining.

![Live chat on event detail page](Picture/p10.png)

### 5.7 Profile Management

1. Click your avatar or **Account** in the navigation bar.
2. Edit your name or email and click **Save Changes**.
3. Click **Upload Photo** below your avatar to upload a new profile picture.
4. Click on the avatar image to view it in full size.

![Profile management page](Picture/p11.png)

### 5.8 Dark Mode

Click the sun/moon icon in the navigation bar to toggle between light and dark themes.

![Dark mode toggle](Picture/p12.png)

## 6.0 Development Guide

This section guides through setting up and running UHub in a local development environment.

### 6.1 Prerequisites

- **Node.js** v18+ and npm
- **Docker Desktop** (for PostgreSQL and Redis)
- **Git**
- An **AWS account** with an S3 bucket (for image uploads)
- A **Gmail account** with an App Password (for email verification), or use Ethereal for testing

### 6.2 Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/lmc0115/ECE1724_Project_UHub.git
cd ECE1724_Project_UHub
```

2. Install all dependencies (npm workspaces):

```bash
npm install
```

3. Create the server environment file at `server/.env`:

```env
DATABASE_URL="postgresql://postgres:your-user-name@127.0.0.1:5432/uhub?schema=public&connect_timeout=10"

AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=your-region
AWS_S3_BUCKET=your-s3-bucket-name

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=UHub <your-email@gmail.com>

REDIS_URL=redis://your-redis-url
```

If `SMTP_HOST` is not set, the server automatically uses an Ethereal test email account and prints preview URLs to the terminal.

### 6.3 Database Initialization

1. Start the PostgreSQL container:

```bash
cd server
chmod +x setupdocker.sh
./setupdocker.sh
```

Or manually with Docker:

```bash
docker run -d --name uhub-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=uhub -p 5432:5432 postgres:16
```

2. Run Prisma migrations and seed the database:

```bash
cd server
chmod +x migrate.sh
./migrate.sh
```

Or manually:

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

3. (Optional) Inspect the database and verify seeded data in Prisma Studio:

```bash
cd server
npx prisma studio
```

### 6.4 Cloud Storage Configuration

1. Create an S3 bucket in your AWS account (e.g., `uhub-images`).
2. Ensure the bucket allows public read access for stored objects (or use presigned URLs).
3. Set the AWS credentials and bucket name in `server/.env`.
4. The server automatically configures CORS rules on the S3 bucket at startup.

### 6.5 Redis Setup (for Live Chat)

Start a Redis container:

```bash
docker run -d --name uhub-redis -p 6379:6379 redis:7
```

The server connects to `redis://127.0.0.1:6379` by default, or set `REDIS_URL` in the environment.

### 6.6 Local Development and Testing

Start the backend and frontend dev servers:

```bash
# Terminal 1 — Backend (port 4000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies `/api` requests to the Express backend at port 4000.

To run backend tests:

```bash
cd server
npm test
```

## 7.0 Deployment Information

The application is deployed on the PaaS [Fly.io](https://fly.io) at **https://uhub.fly.dev**.

| Parameter | Value |
|-----------|-------|
| Region | `yyz`|
| vCPUs | 1 |
| Memory | 512 MB |
| Internal port | 4000 (HTTPS enforced) |
| Min machines running | 1 (Always have 1 machine working)|

The React client is built into `server/public/` at compile time and served as static files by Express, so a single container handles both the API and the SPA.

PostgreSQL is used as the relational database, accessed through Prisma ORM. [Neon](https://neon.tech) provides a serverless PostgreSQL instance. The connection string is supplied via the `DATABASE_URL` environment variable, and Prisma connects to it without any configuration changes.

A managed Upstash Redis instance is provisioned via `fly redis create` and attached to the application. The connection URL is retrieved with `fly redis list`, then injected as an environment variable.

All environment variable are set as secrets (`DATABASE_URL`, `JWT_SECRET`, `AWS_*`, `SMTP_*`, `REDIS_URL`, etc.). They are injected at runtime via `fly secrets set` and are never committed to the repository.

**CI/CD:** A GitHub Actions workflow (`.github/workflows/fly-deploy.yml`) triggers on every push to `main`. It installs `flyctl` and runs `flyctl deploy --remote-only`, building the Docker image on Fly.io's remote builders and promoting it automatically. The `FLY_API_TOKEN` is stored as a GitHub Actions secret.

## 8.0 AI Assistance & Verification

AI tools (primarily Cursor with Claude) were used throughout development as a productivity aid. The team understands where AI was applied, evaluated its output critically, and verified correctness through testing.

### 8.1 Where AI Meaningfully Contributed

- **Architecture exploration:** AI helped structure the monorepo workspace layout, Prisma schema design, and Express middleware chain.
- **Frontend scaffolding:** AI generated initial React page components, Redux slices, and shadcn/ui integration, which were then reviewed and customized.
- **Database queries:** AI assisted with Prisma query patterns for registration capacity checks and ticket validation logic.
- **Debugging:** AI helped diagnose specific issues including S3 CORS errors (leading to the server-side proxy upload solution), React StrictMode double-effect causing email verification failures, and Express TypeScript typing issues.
- **Documentation:** AI helped draft and structure this README report.

### 8.2 A Representative AI Mistake

When implementing image uploads, AI initially generated code for direct browser-to-S3 uploads using presigned URLs. This approach failed in practice due to S3 CORS restrictions that could not be reliably resolved from the browser side. Even after AI suggested programmatically configuring bucket CORS at server startup, the direct upload continued to fail with "Failed to fetch" errors. The team identified that the root cause was the browser's same-origin policy blocking cross-origin PUT requests to S3, and redirected AI to implement a server-side proxy upload using Multer instead — which resolved the issue completely. This demonstrated that AI suggestions need to be validated against real runtime behavior, not just theoretical correctness.

A second notable issue: AI-generated email verification code worked correctly on a single API call, but failed under React's StrictMode (which double-fires `useEffect` in development). The first call consumed the verification token, and the second call immediately failed, showing users a "Verification Failed" screen even though their email was successfully verified in the database. The team diagnosed this by querying the database directly, confirming the email was verified, and then identified the StrictMode double-render as the root cause. The fix was a `useRef` guard to ensure the API call only executes once.

### 8.3 How Correctness Was Verified

- **Manual testing:** Every user flow (registration, email verification, login, event creation, registration, QR check-in, live chat) was tested end-to-end through the browser.
- **Database inspection:** Prisma Studio and direct `psql` queries were used to verify data integrity after operations.
- **Server logs:** Terminal output was monitored for errors, email preview URLs (Ethereal), and Socket.IO connection events.
- **Unit tests:** Jest tests exist for event routes (`server/test/events.routes.test.ts`).
- **Real email testing:** Gmail SMTP was configured to verify the email verification flow with actual email delivery.

## 9.0 Individual Contributions

### 9.1 Jerry Chen (EZmoneySniper250)

- Designed and implemented the initial PostgreSQL schema and Prisma models with relational constraints.
- Built the complete Express.js backend architecture: event CRUD API, authentication middleware (JWT), and password hashing (bcrypt).
- Configured AWS S3 integration for image uploads (presigned URLs and server-side upload).
- Added security enhancements: IP address capture and device fingerprinting on registration.
- Containerized and deployed the application to Fly.io with managed Postgres and Redis.
- Fixed deployment configuration issues (environment variables in fly.toml, socket connectivity).
- **Key commits:** `Initial Framework`, `Event service all finished`, `auth + middleware`, `AWS S3 configured`, `deployed the first version on fly.io`, `Forced IP + Fingerprint enhancement`, `fix all socket issues, ready to deploy`.

### 9.2 Muchen Liu (lmc0115)

- Built the complete React frontend: all pages (Home, Event Detail, My Events, Account, Organizer Events, Event Form, Staff Check-In, Verify Email), Navbar, and EventCard components.
- Implemented Redux Toolkit state management with async thunks for auth, events, and registrations slices.
- Integrated frontend with all backend APIs including registration, login, profile management, and file upload.
- Implemented email verification flow: Nodemailer utility, verification/resend endpoints, frontend verification page with StrictMode fix.
- Connected QR code generation (qrcode.react) and scanning (html5-qrcode) to the registration and check-in flows.
- **Key commits:** `finish the frontend with api connected`, `enable email verification`.

### 9.3 Ziyan Liu (Ziyan9)

- Implemented the real-time live chat feature using Socket.IO with Redis adapter for scalability.
- Built the server-side socket middleware (JWT auth, role-based room access, message persistence in Redis).
- Created the `LiveChatCard` frontend component with real-time message rendering and chat history.
- Added dark mode support with a ThemeProvider context, CSS variables, and system-preference detection.
- Built the organizer dashboard with aggregate statistics (registered count, revenue, checked-in count).
- **Key commits:** `feature: live chat via WebSocket + Redis`, `Add dark mode and organizer event statistics`, `feature: add organizer dashboard top summary`.

## 10.0 Lessons Learned and Concluding Remarks

**Monorepo benefits and pitfalls.** Using npm workspaces allowed shared dependency management and simplified development, but required careful attention to which directory commands were run from — Prisma commands in particular needed to be executed from the `server/` directory.

**S3 CORS is harder than it looks.** Direct browser-to-S3 uploads via presigned URLs are theoretically clean but practically fragile due to CORS. Server-side proxy uploads add a small latency cost but are far more reliable and simpler to debug. This was a key architectural lesson learned during development.

**React StrictMode catches real bugs — eventually.** The double-render behavior in development revealed a genuine race condition in the email verification flow that would have surfaced in any scenario where the same effect fires twice (e.g., component remounts). Guarding one-shot API calls with `useRef` is a pattern worth adopting early.

**Real-time features require infrastructure.** Adding live chat meant introducing Redis as a dependency and configuring the Socket.IO Redis adapter. While the feature added significant user value, it also increased deployment complexity and required careful connection management (pub/sub clients, error handling, graceful disconnects).

**Role-based systems need consistent enforcement.** Having three user roles (student, organizer, staff) meant every endpoint, every navigation link, and every UI element needed to respect role boundaries. The combination of backend middleware (`requireRole`) and frontend conditional rendering provided defense in depth, but required discipline to apply consistently.

**Testing with real services matters.** Using Ethereal for email testing was convenient during development, but switching to real Gmail SMTP revealed timing and delivery issues that would not have been caught otherwise. Similarly, testing S3 uploads against a real bucket exposed CORS issues that mock testing would have missed.

Overall, UHub successfully delivers on its three core objectives: centralizing event discovery, streamlining registration with QR ticketing, and enabling efficient on-site check-in. The project demonstrates a full-stack application with authentication, role-based access control, real-time communication, cloud file storage, and containerized deployment — all built within the course timeline by a team of three.
