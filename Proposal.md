# **UHub Project Proposal**

| Name | Student Number | Email |
| ----- | ----- | ----- |
| Muchen Liu | 1006732145 | muchen.liu@mail.utoronto.ca |
| Jerry Chen | 1006944899 | jianuojerry.chen@mail.utoronto.ca |
| Ziyan Liu | 1011801926 | zycathy.liu@mail.utoronto.ca |

## **1\. Motivation**

Held events have been one of the most important parts of university life, yet the infrastructure supporting them has not kept pace. Across universities, campus activities are currently scattered across Instagram pages, Discord servers, club newsletters, and word of mouth. This fragmentation leaves students without a unified place to discover what is happening on campus and creates a two-sided problem: students miss out on events simply because they never hear about them, while organizers struggle to reach their full potential audience despite their promotional efforts. The challenge does not end at discovery either. Even when students do find and register for an event, organizers face a separate operational bottleneck at the door: manual or disjointed check-in processes slow down entry, create queues, and add unnecessary administrative burden to what should be a seamless experience.

To address these problems, this project will build a centralized web platform for university campus activities. Students will be able to browse events, view event details, register or purchase tickets, and receive a QR code for check-in. On the organizer side, clubs, societies, and campus departments will be able to create and manage events, track registrations, and validate attendance quickly and reliably at the entrance using an integrated QR-scanning system, which also eliminates the need for manual check-in entirely.

This project is worth pursuing because it targets a genuine, recurring need shared by students and organizations across virtually every university campus. While tools like Google Forms, Eventbrite, and social media are each useful in isolation, none of them provides a campus-specific, all-in-one solution that covers event discovery, ticketing, and check-in within a single cohesive experience. A unified platform not only improves event visibility and reduces administrative overhead but also creates a smoother, more connected campus experience, driving outcomes that no existing tool delivers on its own.

The platform is designed for three user groups. The first group is students and general attendees, who need a single reliable place to discover campus events, sign up, and receive everything they need to attend. The second group is event organizers, including clubs, societies, and campus departments, who need efficient tools to create events, manage registrations, and maximize their reach without coordinating across multiple disconnected channels. The third group is event staff, who require a fast and dependable check-in process at the entrance to keep lines moving and attendance records accurate.

---

## **2\. Objective and Key Features**

The proposed solution, UHub, aims to create an aggregated and unified web platform for university campus activities. The project is guided by three core objectives: **centralizing information, ensuring seamless registration, and efficient on-site event management.**

**First, UHub seeks to centralize event discovery and real-time communication.** Currently, students gather information from scattered sources such as social media posts, newsletters, and word of mouth. UHub will provide a single reliable destination where students can browse all campus activities in one place and receive timely notifications. This ensures they stay informed and never miss opportunities to participate in campus life.

**Second, UHub aims to streamline the registration and ticketing process from end to end.** Instead of redirecting students to external forms or third-party tools, UHub enables users to register for events, purchase tickets where applicable, and receive a QR code without leaving the platform. On the organizer side, clubs, societies, and campus departments can create, edit, and remove events directly in UHub, maintaining full control over their event information in a single centralized system.

**Third, UHub focuses on improving the on-site event experience through integrated QR-based attendance validation.** The platform will provide a user-friendly QR scanning system that allows event staff to quickly verify registrations and track attendance. This reduces entry bottlenecks, minimizes administrative workload, and allows organizers to focus on delivering a high-quality event experience.

Together, these three objectives address the full lifecycle of a campus event, resulting from discovery to registration to attendance validation.

| Objective | Feature | Technical Realization |
| ----- | ----- | ----- |
| **Centralizing event discovery and keeping students informed in real time** | Event browsing and filtering | Implemented using a React \+ TypeScript frontend consuming RESTful APIs built with Express.js. Event data is stored in PostgreSQL and queried with filter parameters (campus, date, category, organizer, price). |
|  | Event detail pages with poster images | Event metadata stored in PostgreSQL. Poster images uploaded to AWS S3, with URLs linked to event records and rendered via React components styled with Tailwind CSS and shadcn/ui. |
| **Making the registration and ticketing experience seamless end-to-end** | Secure authentication and role-based access control **(Advanced Features)** | Implemented using Express.js authentication middleware, JWT-based session handling, and role-based authorization logic (attendee, organizer, staff). |
|  | Advanced State Management **(Advanced Features)** | Enables predictable state transitions and centralized logic across the application.  |
|  | Event creation and management | Organizers interact with protected REST endpoints to create, edit, publish, or delete events. Data is persisted in PostgreSQL with relational constraints. |
|  | Ticket registration and simulated payment | Registration flow handled through transactional database operations in PostgreSQL to ensure capacity limits and prevent overselling. |
|  | QR code generation | Unique ticket records created in PostgreSQL and QR codes generated server-side using a QR library within the Express backend. |
| **Ensuring a smooth event day experience** | QR code check-in validation | Staff interface built in React (mobile-optimized). Backend verifies ticket validity and updates check-in status in PostgreSQL, preventing duplicate entries. |
|  | Organizer dashboard | Dashboard implemented using React with dynamic data fetching from Express APIs, displaying registration counts, ticket sales, and attendance metrics. |
|  | Real-time attendance updates **(Advanced Features)**  | Attendance updates reflected through near real-time frontend refresh mechanisms (polling/WebSocket), enabling live monitoring. |

## Database Schema

| Table | Attributes |
|-------|------------|
| **Students** | student_id (PK), name, email, hashed_password, profile_picture_url |
| **Organizers** | organizer_id (PK), name, email, hashed_password, organization_name, profile_picture_url |
| **Staff** | staff_id (PK), name, email, hashed_password |
| **Events** | event_id (PK), title, description, location, date_time, capacity, ticket_price, cover_image_url, organizer_id (FK) |
| **Registrations** | registration_id (PK), student_id (FK), event_id (FK), registration_date, payment_status |
| **Tickets** | ticket_id (PK), registration_id (FK), qr_code_data, redemption_status |
| **Notifications** | notification_id (PK), student_id (FK), event_id (FK), message_content, read_status |


---

## Database Relationships

| Relationship Description |
|--------------------------|
| One **Organizer** can create and manage many **Events** |
| Each **Event** belongs to one **Organizer** |
| One **Student** can register for many **Events** |
| An **Event** can have many **Students** (via **Registrations**) |
| Each **Registration** generates one **Ticket** |
| Each **Ticket** belongs to one **Registration** |
| A **Staff** member can validate many **Tickets** |
| Each **Ticket** can only be redeemed once |
| A **Student** can receive many **Notifications** |
| Each **Notification** belongs to one **Event** |

## **3\. Tentative Plan**

| Week / Phase | Objectives & Focus | Responsibilities (By Team Member) | Expected Outcomes |
| ----- | ----- | ----- | ----- |
| **Week 1 – System Architecture & Database Design** | Establish core backend and frontend structure. Finalize PostgreSQL schema and ensure proper relational constraints. | **Jerry:** Design and implement PostgreSQL schema with relationships and capacity constraints. **Muchen:** Set up Express.js backend architecture and database connection. **Ziyan:** Initialize React \+ TypeScript frontend and configure Tailwind CSS and UI layout. | Functional project skeleton with connected frontend and backend. Database schema documented and operational. |
| **Week 2 – Authentication & Role-Based Access Control** | Implement secure authentication and role-based authorization (student, organizer, staff). | **Jerry:** Refine role-related schema and ensure secure database handling. **Muchen:** Implement JWT authentication, password hashing, and authorization middleware. **Ziyan:** Develop login/register UI and protected frontend routes using global state management. | Secure login system with proper role restrictions across all features. |
| **Week 3 – Event Management & S3 Integration** | Enable event browsing, filtering, and organizer-created events with cloud image storage. | **Jerry:** Configure AWS S3 bucket and manage secure image upload flow. **Muchen:** Develop event CRUD APIs and integrate S3 upload functionality. **Ziyan:** Build event listing, filtering UI, and event detail pages rendering S3-stored images. | Organizers can create events with poster uploads stored in S3 and referenced in PostgreSQL. |
| **Week 4 – Registration & Ticketing System** | Implement transactional registration logic and automatic ticket generation. | **Jerry:** Ensure atomic database operations to prevent overselling. **Muchen:** Implement registration flow with capacity validation and ticket creation. **Ziyan:** Develop registration interface and QR code display page. | Each successful registration generates a unique ticket with QR code while preventing over-capacity registrations. |
| **Week 5 – QR Validation & Organizer Dashboard** | Ensure smooth event-day experience and real-time organizer insights. | **Jerry:** Optimize database queries for attendance metrics. **Muchen:** Implement QR validation endpoint to prevent duplicate check-ins. **Ziyan:** Develop a mobile-friendly staff interface and organizer dashboard displaying registration and attendance metrics. | Staff can validate tickets securely. Organizers can monitor registrations and attendance data. |
| **Final Week – Deployment & Final Report** | Deploy the system and conduct full integration testing before submission. | **Jerry:** Containerize backend and deploy via Fly.io **Muchen:** Perform backend integration testing and edge-case validation. **Ziyan:** Final UI refinement and cross-device responsiveness testing. **All team members: Complete Final Report** | Fully deployed the web-app, ready for final report by April 3, 2026\. |

---

## **4\. Initial Independent Reasoning (Before Using AI)**

### 1\. Application Structure and Architecture

At the start of the project, we chose a **separate frontend and backend architecture**, using React \+ TypeScript for the frontend and Express.js with PostgreSQL for the backend. We considered full-stack frameworks but decided that separating concerns would give us better control over authentication, API design, and database transactions.

This structure also matched our team strengths: Jerry focused on database and deployment, Muchen on backend APIs, and Ziyan on frontend development. PostgreSQL was selected because the system relies on clear relationships between users, events, registrations, and tickets.

### 2\. Data and State Design

We designed the database around core entities: Students, Organizers, Staff, Events, Registrations, Tickets, and Notifications. Registrations link students to events, and each registration generates one ticket. We expected to enforce capacity limits and ticket validation through transactional database logic.

Most critical logic (registration, ticket validation) was planned to run server-side to ensure integrity. On the frontend, we anticipated managing authentication status, user roles, and registration state using lightweight global state management. Poster images were planned to be stored in AWS S3, with only URLs saved in PostgreSQL.

### 3\. Feature Selection and Scope Decisions

We prioritized building a stable core workflow first:

* Authentication with role-based access  
* Event browsing and creation  
* Student registration with capacity control  
* Ticket generation and validation

We discussed advanced features such as real-time updates, but decided to implement them only after the core system was functional. Our focus was on reliability over complexity within the limited timeline.

### 4\. Anticipated Challenges

Before implementation, we expected challenges in:

* Designing secure role-based authentication  
* Preventing overselling during concurrent registrations  
* Managing frontend–backend integration  
* Ensuring QR codes cannot be redeemed more than once

These concerns influenced our decision to keep the system modular and clearly structured.

### 5\. Early Collaboration Plan

Responsibilities were divided based on strengths:

* **Jerry Chen:** Database design, S3 integration, deployment  
* **Muchen Liu:** Backend APIs, authentication, registration logic  
* **Ziyan Liu:** Frontend UI and state management

We planned early alignment on database schema and API contracts before major development, with regular integration checkpoints to reduce conflicts later.

## **5\. AI Assistance Disclosure**

Most of the proposal structure, system design decisions, database schema, and feature selection were developed independently by our team through discussion before consulting any AI tools. Our decisions regarding using a separate frontend and backend architecture, PostgreSQL for relational integrity, AWS S3 for image storage, and Fly.io for deployment were based on our own technical experience and feasibility considerations.

AI was used primarily to help refine wording and improve clarity in certain sections of the written proposal. It also assisted in organizing some paragraphs to ensure the explanation was concise and well-structured.

One suggestion influenced by AI was emphasizing transactional database handling for preventing ticket overselling. While we had already identified concurrency as a concern, AI reinforced the importance of explicit atomic operations. We discussed implementation complexity and confirmed that it was feasible within our timeline before adopting that approach.