/*
Authentication routes for the UHub application.

Routes:
  POST /api/auth/register/student   – create a student account
  POST /api/auth/register/organizer – create an organizer account
  POST /api/auth/register/staff     – create a staff account
  POST /api/auth/login              – sign in (auto-detects role)
  GET  /api/auth/me                 – return the current user's profile (JWT required)
  PUT  /api/auth/me                 – update the current user's name/email (JWT required)
  POST /api/auth/avatar/presigned-url – get a presigned S3 PUT URL for avatar upload (JWT required)
  PUT  /api/auth/avatar             – save the uploaded avatar URL to the user's profile (JWT required)

  Helper functions:
  - signToken(sub: string, role: UserRole): string
  - isValidEmail(email: string): boolean
  - isStrongPassword(password: string): boolean

*/

import { Request, Response, Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { generatePresignedUploadUrl, isAllowedImageType, keyFromPublicUrl, deleteS3Object } from "../../lib/s3.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  AuthPayload,
  UserRole,
  RegisterStudentBody,
  RegisterOrganizerBody,
  RegisterStaffBody,
  LoginBody,
  AvatarPresignedUrlBody,
  AvatarUpdateBody
} from "../../types/type.js";

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
    const { name, email, password, avatarUrl } = req.body as RegisterStudentBody;

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
        avatarUrl: avatarUrl ?? null
      }
    });

    const token = signToken(student.id, "student");

    return res.status(201).json({
      token,
      user: {
        id:        student.id,
        name:      student.name,
        email:     student.email,
        role:      "student" as UserRole,
        avatarUrl: student.avatarUrl
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
    const { name, email, password, organizationName, avatarUrl } = req.body as RegisterOrganizerBody;

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
        avatarUrl: avatarUrl ?? null
      }
    });

    const token = signToken(organizer.id, "organizer");

    return res.status(201).json({
      token,
      user: {
        id:               organizer.id,
        name:             organizer.name,
        email:            organizer.email,
        role:             "organizer" as UserRole,
        organizationName: organizer.organizationName,
        avatarUrl:        organizer.avatarUrl
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
    const { name, email, password, avatarUrl } = req.body as RegisterStaffBody;

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
      data: { name, email, hashedPassword, avatarUrl: avatarUrl ?? null }
    });

    const token = signToken(staff.id, "staff");

    return res.status(201).json({
      token,
      user: {
        id:        staff.id,
        name:      staff.name,
        email:     staff.email,
        role:      "staff" as UserRole,
        avatarUrl: staff.avatarUrl
      }
    });
  } catch (error) {
    console.error("Register staff error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
// Auto-detects role by searching students → organizers → staff in order.

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const student = await prisma.student.findUnique({ where: { email } });
    if (student) {
      const match = await bcrypt.compare(password, student.hashedPassword);
      if (!match) return res.status(401).json({ error: "Invalid credentials." });

      const token = signToken(student.id, "student");
      return res.status(200).json({
        token,
        user: {
          id:        student.id,
          name:      student.name,
          email:     student.email,
          role:      "student" as UserRole,
          avatarUrl: student.avatarUrl
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
          id:               organizer.id,
          name:             organizer.name,
          email:            organizer.email,
          role:             "organizer" as UserRole,
          organizationName: organizer.organizationName,
          avatarUrl:        organizer.avatarUrl
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
          id:        staff.id,
          name:      staff.name,
          email:     staff.email,
          role:      "staff" as UserRole,
          avatarUrl: staff.avatarUrl
        }
      });
    }

    // Same error message whether the email doesn't exist or the password is wrong
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
        id:        student.id,
        name:      student.name,
        email:     student.email,
        role,
        avatarUrl: student.avatarUrl,
        createdAt: student.createdAt
      });
    }

    if (role === "organizer") {
      const organizer = await prisma.organizer.findUnique({ where: { id } });
      if (!organizer) return res.status(404).json({ error: "User not found." });
      return res.status(200).json({
        id:               organizer.id,
        name:             organizer.name,
        email:            organizer.email,
        role,
        organizationName: organizer.organizationName,
        avatarUrl:        organizer.avatarUrl,
        createdAt:        organizer.createdAt
      });
    }

    if (role === "staff") {
      const staff = await prisma.staff.findUnique({ where: { id } });
      if (!staff) return res.status(404).json({ error: "User not found." });
      return res.status(200).json({
        id:        staff.id,
        name:      staff.name,
        email:     staff.email,
        role,
        avatarUrl: staff.avatarUrl,
        createdAt: staff.createdAt
      });
    }

    return res.status(400).json({ error: "Unknown role." });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── PUT /api/auth/me ──────────────────────────────────────────────────────────

authRouter.put("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const { sub: id, role } = req.user!;
    const { name, email } = req.body as { name?: string; email?: string };

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    const data: Record<string, string> = {};
    if (name) data.name = name;
    if (email) data.email = email;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "At least one field (name or email) is required." });
    }

    if (role === "student") {
      if (email) {
        const existing = await prisma.student.findUnique({ where: { email } });
        if (existing && existing.id !== id) {
          return res.status(409).json({ error: "Email is already in use." });
        }
      }
      const student = await prisma.student.update({ where: { id }, data });
      return res.status(200).json({
        id: student.id, name: student.name, email: student.email,
        role, avatarUrl: student.avatarUrl
      });
    }

    if (role === "organizer") {
      if (email) {
        const existing = await prisma.organizer.findUnique({ where: { email } });
        if (existing && existing.id !== id) {
          return res.status(409).json({ error: "Email is already in use." });
        }
      }
      const organizer = await prisma.organizer.update({ where: { id }, data });
      return res.status(200).json({
        id: organizer.id, name: organizer.name, email: organizer.email,
        role, organizationName: organizer.organizationName, avatarUrl: organizer.avatarUrl
      });
    }

    if (role === "staff") {
      if (email) {
        const existing = await prisma.staff.findUnique({ where: { email } });
        if (existing && existing.id !== id) {
          return res.status(409).json({ error: "Email is already in use." });
        }
      }
      const staff = await prisma.staff.update({ where: { id }, data });
      return res.status(200).json({
        id: staff.id, name: staff.name, email: staff.email,
        role, avatarUrl: staff.avatarUrl
      });
    }

    return res.status(400).json({ error: "Unknown role." });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /api/auth/avatar/presigned-url ──────────────────────────────────────
// Step 1 of the avatar upload flow.
// Returns a presigned S3 PUT URL valid for 5 minutes.
// The client uploads the image file directly to S3 using this URL,
// then calls PUT /api/auth/avatar with the resulting publicUrl.

authRouter.post("/avatar/presigned-url", requireAuth, async (req: Request, res: Response) => {
  try {
    const { contentType } = req.body as AvatarPresignedUrlBody;

    if (!contentType) {
      return res.status(400).json({ error: "contentType is required." });
    }
    if (!isAllowedImageType(contentType)) {
      return res.status(400).json({
        error: "Unsupported image type. Allowed: image/jpeg, image/png, image/webp, image/gif."
      });
    }

    const { sub: userId } = req.user!;
    const { uploadUrl, publicUrl, key } = await generatePresignedUploadUrl(
      "avatars",
      userId,
      contentType
    );

    return res.status(200).json({ uploadUrl, publicUrl, key });
  } catch (error) {
    console.error("Avatar presigned URL error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── PUT /api/auth/avatar ──────────────────────────────────────────────────────
// Step 2 of the avatar upload flow.
// After the client has uploaded the image to S3, call this endpoint with
// the publicUrl to persist it on the user's profile.
// If the user already has an avatar stored in this bucket, the old object
// is deleted from S3 automatically.

authRouter.put("/avatar", requireAuth, async (req: Request, res: Response) => {
  try {
    const { avatarUrl } = req.body as AvatarUpdateBody;

    if (!avatarUrl) {
      return res.status(400).json({ error: "avatarUrl is required." });
    }

    const { sub: id, role } = req.user!;

    if (role === "student") {
      const student = await prisma.student.findUnique({ where: { id } });
      if (!student) return res.status(404).json({ error: "User not found." });

      if (student.avatarUrl) {
        const oldKey = keyFromPublicUrl(student.avatarUrl);
        if (oldKey) await deleteS3Object(oldKey).catch(() => null);
      }

      const updated = await prisma.student.update({
        where: { id },
        data:  { avatarUrl }
      });
      return res.status(200).json({ avatarUrl: updated.avatarUrl });
    }

    if (role === "organizer") {
      const organizer = await prisma.organizer.findUnique({ where: { id } });
      if (!organizer) return res.status(404).json({ error: "User not found." });

      if (organizer.avatarUrl) {
        const oldKey = keyFromPublicUrl(organizer.avatarUrl);
        if (oldKey) await deleteS3Object(oldKey).catch(() => null);
      }

      const updated = await prisma.organizer.update({
        where: { id },
        data:  { avatarUrl }
      });
      return res.status(200).json({ avatarUrl: updated.avatarUrl });
    }

    if (role === "staff") {
      const staff = await prisma.staff.findUnique({ where: { id } });
      if (!staff) return res.status(404).json({ error: "User not found." });

      if (staff.avatarUrl) {
        const oldKey = keyFromPublicUrl(staff.avatarUrl);
        if (oldKey) await deleteS3Object(oldKey).catch(() => null);
      }

      const updated = await prisma.staff.update({
        where: { id },
        data:  { avatarUrl }
      });
      return res.status(200).json({ avatarUrl: updated.avatarUrl });
    }

    return res.status(400).json({ error: "Unknown role." });
  } catch (error) {
    console.error("Avatar update error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});
