import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AuthPayload, UserRole } from "../types/type.js";

/**
 * requireAuth — verifies the Bearer JWT in the Authorization header and
 * attaches the decoded payload to req.user.  Returns 401 if missing or
 * invalid, 403 if the token is expired.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authorization header missing or malformed." });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(403).json({ error: "Token has expired." });
    } else {
      res.status(401).json({ error: "Invalid token." });
    }
  }
};

/**
 * requireRole — middleware factory that gates a route to one or more roles.
 * Must be used after requireAuth.
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: insufficient permissions." });
      return;
    }
    next();
  };
