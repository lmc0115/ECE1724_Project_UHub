/*
This file defines the API routes for authentication in the UHub application. It includes endpoints for registering and logging in users. The routes are implemented using Express and interact with a Prisma client to perform database operations. Input validation and error handling are included to ensure robust API behavior.
The main routes are:
- POST /api/auth/register/student: Register a new student
- POST /api/auth/register/organizer: Register a new organizer
- POST /api/auth/register/staff: Register a new staff
- POST /api/auth/login: Login a user
- GET /api/auth/me: Get the current user

The middleware used is requireAuth, which verifies the Bearer JWT in the Authorization header and attaches the decoded payload to req.user.
Each route includes input normalization and validation to handle various input formats and ensure data integrity. Server errors are logged and returned with a 500 status code, while client errors (e.g., invalid input, not found) return appropriate status codes and error messages.

Helper Functions:
- signToken: Signs a JWT token with the given sub and role.
- isValidEmail: Checks if the email is valid.
- isStrongPassword: Checks if the password is strong.
*/
import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { AuthPayload, UserRole } from "../../types/type.js";

export const authRouter = Router();

const SALT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

const signToken = (sub: string, role: UserRole): string =>
  jwt.sign({ sub, role } satisfies AuthPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password: string) => password.length >= 8;

// ── POST /api/auth/register/student ──────────────────────────────────────────

authRouter.post("/register/student", async (req: Request, res: Response) => {
  try {
    const { name, email, password, profilePictureUrl } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      profilePictureUrl?: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const student = await prisma.student.create({
      data: {
        name,
        email,
        hashedPassword,
        profilePictureUrl: profilePictureUrl ?? null
      }
    });

    const token = signToken(student.id, "student");

    return res.status(201).json({
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: "student" as UserRole,
        profilePictureUrl: student.profilePictureUrl
      }
    });
  } catch (error) {
    console.error("Register student error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /api/auth/register/organizer ────────────────────────────────────────

authRouter.post("/register/organizer", async (req: Request, res: Response) => {
  try {
    const { name, email, password, organizationName, profilePictureUrl } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      organizationName?: string;
      profilePictureUrl?: string;
    };

    if (!name || !email || !password || !organizationName) {
      return res
        .status(400)
        .json({ error: "name, email, password, and organizationName are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const existing = await prisma.organizer.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const organizer = await prisma.organizer.create({
      data: {
        name,
        email,
        hashedPassword,
        organizationName,
        profilePictureUrl: profilePictureUrl ?? null
      }
    });

    const token = signToken(organizer.id, "organizer");

    return res.status(201).json({
      token,
      user: {
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
        role: "organizer" as UserRole,
        organizationName: organizer.organizationName,
        profilePictureUrl: organizer.profilePictureUrl
      }
    });
  } catch (error) {
    console.error("Register organizer error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /api/auth/register/staff ────────────────────────────────────────────

authRouter.post("/register/staff", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required." });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const existing = await prisma.staff.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const staff = await prisma.staff.create({
      data: { name, email, hashedPassword }
    });

    const token = signToken(staff.id, "staff");

    return res.status(201).json({
      token,
      user: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: "staff" as UserRole
      }
    });
  } catch (error) {
    console.error("Register staff error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
// Auto-detects role by searching students ,organizers and staff in order.

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    // Try each role table in priority order
    const student = await prisma.student.findUnique({ where: { email } });
    if (student) {
      const match = await bcrypt.compare(password, student.hashedPassword);
      if (!match) return res.status(401).json({ error: "Invalid credentials." });

      const token = signToken(student.id, "student");
      return res.status(200).json({
        token,
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          role: "student" as UserRole,
          profilePictureUrl: student.profilePictureUrl
        }
      });
    }

    const organizer = await prisma.organizer.findUnique({ where: { email } });
    if (organizer) {
      const match = await bcrypt.compare(password, organizer.hashedPassword);
      if (!match) return res.status(401).json({ error: "Invalid credentials." });

      const token = signToken(organizer.id, "organizer");
      return res.status(200).json({
        token,
        user: {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email,
          role: "organizer" as UserRole,
          organizationName: organizer.organizationName,
          profilePictureUrl: organizer.profilePictureUrl
        }
      });
    }

    const staff = await prisma.staff.findUnique({ where: { email } });
    if (staff) {
      const match = await bcrypt.compare(password, staff.hashedPassword);
      if (!match) return res.status(401).json({ error: "Invalid credentials." });

      const token = signToken(staff.id, "staff");
      return res.status(200).json({
        token,
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: "staff" as UserRole
        }
      });
    }

    // Email not found in any table — return the same message to avoid enumeration
    return res.status(401).json({ error: "Invalid credentials." });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────

authRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sub: id, role } = req.user!;

    if (role === "student") {
      const student = await prisma.student.findUnique({ where: { id } });
      if (!student) return res.status(404).json({ error: "User not found." });
      return res.status(200).json({
        id: student.id,
        name: student.name,
        email: student.email,
        role,
        profilePictureUrl: student.profilePictureUrl,
        createdAt: student.createdAt
      });
    }

    if (role === "organizer") {
      const organizer = await prisma.organizer.findUnique({ where: { id } });
      if (!organizer) return res.status(404).json({ error: "User not found." });
      return res.status(200).json({
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
        role,
        organizationName: organizer.organizationName,
        profilePictureUrl: organizer.profilePictureUrl,
        createdAt: organizer.createdAt
      });
    }

    if (role === "staff") {
      const staff = await prisma.staff.findUnique({ where: { id } });
      if (!staff) return res.status(404).json({ error: "User not found." });
      return res.status(200).json({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role,
        createdAt: staff.createdAt
      });
    }

    return res.status(400).json({ error: "Unknown role." });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});
