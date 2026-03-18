import { Request, Response, Router } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";
import { isAllowedImageType, uploadBufferToS3, keyFromPublicUrl, deleteS3Object } from "../../lib/s3.js";
import { prisma } from "../../lib/prisma.js";

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedImageType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported image type. Allowed: jpeg, png, webp, gif."));
    }
  },
});

// POST /api/upload/avatar — upload profile image (all authenticated users)
uploadRouter.post(
  "/avatar",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided." });
      }

      const { sub: id, role } = req.user!;
      const { publicUrl } = await uploadBufferToS3("avatars", id, file.mimetype, file.buffer);

      if (role === "student") {
        const student = await prisma.student.findUnique({ where: { id } });
        if (student?.avatarUrl) {
          const oldKey = keyFromPublicUrl(student.avatarUrl);
          if (oldKey) await deleteS3Object(oldKey).catch(() => null);
        }
        await prisma.student.update({ where: { id }, data: { avatarUrl: publicUrl } });
      } else if (role === "organizer") {
        const organizer = await prisma.organizer.findUnique({ where: { id } });
        if (organizer?.avatarUrl) {
          const oldKey = keyFromPublicUrl(organizer.avatarUrl);
          if (oldKey) await deleteS3Object(oldKey).catch(() => null);
        }
        await prisma.organizer.update({ where: { id }, data: { avatarUrl: publicUrl } });
      } else if (role === "staff") {
        const staff = await prisma.staff.findUnique({ where: { id } });
        if (staff?.avatarUrl) {
          const oldKey = keyFromPublicUrl(staff.avatarUrl);
          if (oldKey) await deleteS3Object(oldKey).catch(() => null);
        }
        await prisma.staff.update({ where: { id }, data: { avatarUrl: publicUrl } });
      }

      return res.status(200).json({ avatarUrl: publicUrl });
    } catch (error) {
      console.error("Avatar upload error:", error);
      return res.status(500).json({ error: "Upload failed." });
    }
  }
);

// POST /api/upload/event-cover — upload event cover image (organizers only)
uploadRouter.post(
  "/event-cover",
  requireAuth,
  requireRole("organizer"),
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided." });
      }

      const organizerId = req.user!.sub;
      const { publicUrl } = await uploadBufferToS3("events/covers", organizerId, file.mimetype, file.buffer);

      return res.status(200).json({ coverImageUrl: publicUrl });
    } catch (error) {
      console.error("Event cover upload error:", error);
      return res.status(500).json({ error: "Upload failed." });
    }
  }
);
