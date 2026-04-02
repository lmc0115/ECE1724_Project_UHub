import { randomUUID } from "crypto";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { redisClient } from "./redis.js";
import type { AuthPayload } from "../types/type.js";

type SupportedChatRole = "student" | "organizer";

type SocketUser = AuthPayload & {
  role: SupportedChatRole;
};

type ChatMessage = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  role: SupportedChatRole;
  content: string;
  createdAt: string;
};

type JoinPayload = {
  eventId: string;
};

type MessagePayload = {
  eventId: string;
  content: string;
};

type AckResponse =
  | { ok: true; messages?: ChatMessage[] }
  | { ok: true; message?: ChatMessage }
  | { ok: false; error: string };

const CHAT_HISTORY_LIMIT = 50;

function isSupportedChatRole(role: string): role is SupportedChatRole {
  return role === "student" || role === "organizer";
}

function getRoomName(eventId: string) {
  return `event:${eventId}`;
}

function getHistoryKey(eventId: string) {
  return `chat:event:${eventId}:messages`;
}

function getTokenFromSocket(socket: any): string | null {
  const authToken =
    typeof socket.handshake.auth?.token === "string"
      ? socket.handshake.auth.token
      : null;

  if (authToken) {
    return authToken.startsWith("Bearer ") ? authToken.slice(7) : authToken;
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
}

async function getUserDisplayName(user: SocketUser) {
  if (user.role === "student") {
    const student = await prisma.student.findUnique({
      where: { id: user.sub },
      select: { name: true },
    });
    return student?.name || "Student";
  }

  const organizer = await prisma.organizer.findUnique({
    where: { id: user.sub },
    select: { name: true, organizationName: true },
  });

  return organizer?.organizationName || organizer?.name || "Organizer";
}

async function canAccessEventChat(user: SocketUser, eventId: string) {
  if (user.role === "organizer") {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: user.sub,
      },
      select: { id: true },
    });

    return !!event;
  }

  const registration = await prisma.registration.findUnique({
    where: {
      studentId_eventId: {
        studentId: user.sub,
        eventId,
      },
    },
    select: { id: true },
  });

  return !!registration;
}

async function readRecentMessages(eventId: string) {
  const raw = await redisClient.lRange(getHistoryKey(eventId), 0, -1);
  return raw.map((item) => JSON.parse(item) as ChatMessage);
}

async function saveMessage(message: ChatMessage) {
  const key = getHistoryKey(message.eventId);
  await redisClient.rPush(key, JSON.stringify(message));
  await redisClient.lTrim(key, -CHAT_HISTORY_LIMIT, -1);
}

export function initSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = getTokenFromSocket(socket);

      if (!token) {
        next(new Error("Authentication required."));
        return;
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;

      if (!isSupportedChatRole(decoded.role)) {
        next(new Error("This role cannot access live chat."));
        return;
      }

      socket.data.user = decoded as SocketUser;
      next();
    } catch {
      next(new Error("Invalid token."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("chat:join", async (payload: JoinPayload, callback?: (response: AckResponse) => void) => {
      try {
        const eventId = payload?.eventId;

        if (!eventId) {
          callback?.({ ok: false, error: "eventId is required." });
          return;
        }

        const user = socket.data.user as SocketUser;
        const allowed = await canAccessEventChat(user, eventId);

        if (!allowed) {
          callback?.({ ok: false, error: "You do not have access to this event chat." });
          return;
        }

        socket.join(getRoomName(eventId));

        const messages = await readRecentMessages(eventId);
        callback?.({ ok: true, messages });
      } catch (error) {
        console.error("chat:join error:", error);
        callback?.({ ok: false, error: "Failed to join chat room." });
      }
    });

    socket.on("chat:leave", (payload: JoinPayload) => {
      const eventId = payload?.eventId;
      if (!eventId) return;
      socket.leave(getRoomName(eventId));
    });

    socket.on("chat:message", async (payload: MessagePayload, callback?: (response: AckResponse) => void) => {
      try {
        const eventId = payload?.eventId;
        const content = payload?.content?.trim();

        if (!eventId) {
          callback?.({ ok: false, error: "eventId is required." });
          return;
        }

        if (!content) {
          callback?.({ ok: false, error: "Message content cannot be empty." });
          return;
        }

        if (content.length > 500) {
          callback?.({ ok: false, error: "Message is too long." });
          return;
        }

        const user = socket.data.user as SocketUser;
        const allowed = await canAccessEventChat(user, eventId);

        if (!allowed) {
          callback?.({ ok: false, error: "You do not have access to this event chat." });
          return;
        }

        const userName = await getUserDisplayName(user);

        const message: ChatMessage = {
          id: randomUUID(),
          eventId,
          userId: user.sub,
          userName,
          role: user.role,
          content,
          createdAt: new Date().toISOString(),
        };

        await saveMessage(message);

        io.to(getRoomName(eventId)).emit("chat:message", message);
        callback?.({ ok: true, message });
      } catch (error) {
        console.error("chat:message error:", error);
        callback?.({ ok: false, error: "Failed to send message." });
      }
    });
  });

  return io;
}